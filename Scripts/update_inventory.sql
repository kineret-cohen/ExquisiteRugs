drop procedure er_update_inventory;

DELIMITER $$

CREATE PROCEDURE `er_update_inventory`()
BEGIN

	-- verify we have something to update
	DECLARE input_cnt INT DEFAULT 0;
    select count(1) from er_stage_inventory into input_cnt;
    
    if input_cnt > 10 THEN 

		-- clean up unrelevant items
		delete from er_stage_inventory
		where item in ('- None -','Item','Internal ID','') OR design not regexp '^[0-9]+$';

		-- set size column
		update  er_stage_inventory
		set size=RIGHT(`item`,char_length(`item`)- LOCATE("-", `item`));
		
		-- clean up more un-relevant items
		delete from er_stage_inventory
		where size in ('SpecialSize','Under50','Over180');

		update er_stage_inventory
		set size=replace(size,'"""','"');

		update er_stage_inventory
		set size=replace(size,'""','"');

		update er_stage_inventory
		set size=replace(size,'''"','"');


		-- do the merge (truncate and reload)
		truncate er_inventory;
		insert ignore into er_inventory(design, size, in_stock, in_transit, in_transit_eta, on_loom, on_loom_eta, sort_by_size_1,sort_by_size_2, report_date)
			select 	design, size, in_stock, in_transit, in_transit_eta, on_loom, on_loom_eta, 
			case  when size  not like '%X%'
				then  0 else  trim(replace(replace(replace(LEFT(`size`, LOCATE("X", `size`)-1),'''','.'),'""',''),'"','')) 
			end as sort_by_size_1,
			case when size  not like '%X%'
				then  0 else trim(replace(replace(replace(replace(replace(RIGHT(`size`,char_length(`size`)- LOCATE("X", `size`)),'''','.'),'"""',''),'"',''),' ROUND',''),'RUNNER',''))  
			end as sort_by_size_2,
			now() as report_date
			from er_stage_inventory;
                        
                        
		-- generate data for product level update
		truncate er_stage_product_inventory;
		insert into er_stage_product_inventory(product_id, sku, meta_id, current_stock_status, new_stock_status)
		select a.product_id, d.sku, c.meta_id, c.stock_status, 
		case when e.in_stock is null or  e.in_stock = 0 then 'outofstock' else 'instock' end as new_stock_status
		from
		(select id as product_id
		from hbi_posts
		where post_type='product') a
		inner join (
		select post_id, meta_id, meta_value as stock_status
		from hbi_postmeta 
		where meta_key = '_stock_status'
		) c 
		on a.product_id = c.post_id
		inner join 
		(select post_id, meta_value as sku 
		from hbi_postmeta
		where meta_key in ('_sku') and meta_value <> '') d 
		on a.product_id = d.post_id
		left join (
		select design, sum(in_stock) as in_stock
		from er_inventory
		group by design
		) e
		on d.sku = e.design;
        
        -- update wordpress
        update hbi_postmeta pm inner join er_stage_product_inventory pii 
		on pii.meta_id = pm.meta_id
		set pm.meta_value = pii.new_stock_status 
		where pii.new_stock_status <> pm.meta_value;

		-- log
		insert into er_etl_history( timestamp, table_name, rows_updated)
        values(now(), 'er_stage_product_inventory', ROW_COUNT());
        
        
        -- generate data for variation update
		truncate er_stage_variation_inventory;
		insert into er_stage_variation_inventory(  variation_id, product_id, sku, size, meta_id, current_stock_status, new_stock_status)
		select a.variation_id, a.product_id, d.sku, b.size, c.meta_id, c.stock_status, 
		case when e.in_stock is null or e.in_stock = 0 then 'outofstock' else 'instock' end as new_stock_status
		from
		(select id as variation_id, post_parent as product_id
		from hbi_posts
		where post_type='product_variation') a
		inner join (
		select post_id, meta_id, meta_value as size
		from hbi_postmeta 
		where meta_key = 'attribute_pa_size'
		) b 
		on a.variation_id = b.post_id
		inner join (
		select post_id, meta_id, meta_value as stock_status
		from hbi_postmeta 
		where meta_key = '_stock_status'
		) c 
		on a.variation_id = c.post_id
		inner join 
		(select post_id, meta_value as sku 
		from hbi_postmeta
		where meta_key in ('_sku') and meta_value <> '') d 
		on a.product_id = d.post_id

		left join (
		select design, replace(replace(size, '"', ''), "'", '') as size, in_stock from er_inventory
		) e
		on d.sku = e.design and b.size = e.size;
        
        -- update wordpress
		update hbi_postmeta pm inner join  er_stage_variation_inventory pii 
		on pii.meta_id = pm.meta_id 
		set pm.meta_value = pii.new_stock_status
		where  pii.new_stock_status <> pm.meta_value;
		

        -- log
		insert into er_etl_history( timestamp, table_name, rows_updated)
        values(now(), 'er_stage_variation_inventory', ROW_COUNT());
	
		
		
        -- generate data for variation inventory size update
		truncate er_stage_variation_inventory_size;
		insert into er_stage_variation_inventory_size(  variation_id, product_id, sku, size, meta_id, current_stock, new_stock)
		select a.variation_id, a.product_id, d.sku, b.size, c.meta_id, 
        IFNULL(c.stock,0) as stock, 
		IFNULL(e.in_stock,0) as new_stock
		from
		(select id as variation_id, post_parent as product_id
		from hbi_posts
		where post_type='product_variation') a
		inner join (
		select post_id, meta_id, meta_value as size
		from hbi_postmeta 
		where meta_key = 'attribute_pa_size'
		) b 
		on a.variation_id = b.post_id
		inner join (
		select post_id, meta_id, meta_value as stock
		from hbi_postmeta 
		where meta_key = '_stock'
		) c 
		on a.variation_id = c.post_id
		inner join 
		(select post_id, meta_value as sku 
		from hbi_postmeta
		where meta_key in ('_sku') and meta_value <> '') d 
		on a.product_id = d.post_id

		left join (
		select design, replace(replace(size, '"', ''), "'", '') as size, in_stock from er_inventory
		) e
		on d.sku = e.design and b.size = e.size;
        
        -- update wordpress
		update hbi_postmeta pm inner join  er_stage_variation_inventory_size pii 
		on pii.meta_id = pm.meta_id 
		set pm.meta_value = pii.new_stock
		where  pii.new_stock <> pm.meta_value;
		

        -- log
		insert into er_etl_history( timestamp, table_name, rows_updated)
        values(now(), 'er_stage_variation_inventory_size', ROW_COUNT());
        
        
		-- update studio_library tables
		truncate studio_library.er_inventory;
    
		insert into studio_library.er_inventory(design, size, in_stock, in_transit, in_transit_eta, on_loom, on_loom_eta, sort_by_size_1,sort_by_size_2, report_date)
		select design, size, in_stock, in_transit, in_transit_eta, on_loom, on_loom_eta, sort_by_size_1,sort_by_size_2, report_date
		from rugs.er_inventory;

	END IF;

END$$
DELIMITER ;
