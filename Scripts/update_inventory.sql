drop procedure er_update_inventory;

DELIMITER $$

CREATE PROCEDURE er_update_inventory()
BEGIN

	-- verify we have something to update
	DECLARE input_cnt INT DEFAULT 0;
    select count(1) from netsuite_input_stock_sheet_summary_b2b into input_cnt;
    
    if input_cnt > 10 THEN 

		-- clean up unrelevant items
		delete from netsuite_input_stock_sheet_summary_b2b
		where item in ('- None -','Item','Internal ID','') OR design not regexp '^[0-9]+$';

		-- set size column
		update  netsuite_input_stock_sheet_summary_b2b
		set size=RIGHT(`item`,char_length(`item`)- LOCATE("-", `item`));
		
		-- clean up more un-relevant items
		delete from netsuite_input_stock_sheet_summary_b2b
		where size in ('SpecialSize','Under50','Over180');

		update netsuite_input_stock_sheet_summary_b2b
		set size=replace(size,'"""','"');

		update netsuite_input_stock_sheet_summary_b2b
		set size=replace(size,'""','"');

		update netsuite_input_stock_sheet_summary_b2b
		set size=replace(size,'''"','"');

		-- update category size
		update  netsuite_input_stock_sheet_summary_b2b
		set category_size='SAMPLE'
		where size in ('2''X3''','1''X1''6"');

		update  netsuite_input_stock_sheet_summary_b2b
		set category_size='oversized'
		where 
		size like  '15%x%' or
		size like  '16%x%' or
		size like  '17%x%' or
		size like  '18%x%' or
		size like  '19%x%' or
		size like  '20%x%' or
		size like  '21%x%' or
		size like  '22%x%' or
		size like  '23%x%' or
		size like  '24%x%' or
		size like  '25%x%' or
		size like  '26%x%' or
		size like  '27%x%' or
		size like  '29%x%' or
		size like  '30%x%' ;


		-- do the merge (truncate and reload)
		truncate er_reports;
		insert into er_reports(design, size, category_size, in_stock, in_transit, eta,sort_by_size_1,sort_by_size_2, on_loom, report_date)
			select 	design,
						size,
						category_size,
						availble as in_stock,
						case when in_transit-bo > 0 then in_transit-bo  else '0' 
						end as in_transit,
						case when in_transit-bo > 0 then eta   else null 
						end as eta,
						case  when size  not like '%X%'
							then  0 else  trim(replace(replace(replace(LEFT(`size`, LOCATE("X", `size`)-1),'''','.'),'""',''),'"','')) 
						end as sort_by_size_1, 
						case when size  not like '%X%'
							then  0 else trim(replace(replace(replace(replace(replace(RIGHT(`size`,char_length(`size`)- LOCATE("X", `size`)),'''','.'),'"""',''),'"',''),' ROUND',''),'RUNNER',''))  
						end as sort_by_size_2,
						case when  on_loom=0 
							then 0 else  case when (in_transit+on_loom)-bo > 0 
													then 1  else 0 
												end  
						end as on_loom,
						curdate() as report_date
						from netsuite_input_stock_sheet_summary_b2b;
                        
                        
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
		from er_reports
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
		select design, replace(replace(size, '"', ''), "'", '') as size, in_stock from er_reports
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

	END IF;

END$$

DELIMITER ;


