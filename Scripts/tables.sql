

update hbi_postmeta pm inner join er_stage_product_inventory pii 
on pii.meta_id = pm.meta_id
set pm.meta_value = pii.new_stock_status 
where pii.new_stock_status <> pm.meta_value;


select * from  hbi_postmeta pm inner join er_stage_product_inventory pii 
on pii.meta_id = pm.meta_id
where pii.new_stock_status <> pm.meta_value;


update hbi_postmeta pm inner join  er_stage_variation_inventory pii 
on pii.meta_id = pm.meta_id 
set pm.meta_value = pii.new_stock_status
where  pii.new_stock_status <> pm.meta_value;


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
		on d.sku = e.design and b.size = e.size
        where product_id = 80271
        order by size;


CREATE TABLE `er_stage_inventory` (
  `item` varchar(127) DEFAULT NULL,
  `design` varchar(255) DEFAULT NULL,
  `category_size` varchar(63) DEFAULT NULL,
  `availble` int DEFAULT NULL,
  `in_transit` int DEFAULT NULL,
  `in_transit_eta` varchar(255) DEFAULT NULL,
  `on_loom` int DEFAULT NULL,
  `on_loom_eta` varchar(31) DEFAULT NULL,
  `size` varchar(63) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `er_inventory` (
  `design` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `availble` int DEFAULT NULL,
  `in_transit` int DEFAULT NULL,
  `in_transit_eta` varchar(255) DEFAULT NULL,
  `on_loom` int DEFAULT NULL,
  `on_loom_eta` varchar(31) DEFAULT NULL,
  `sort_by_size_1` double(10,4) DEFAULT NULL,
  `sort_by_size_2` double(10,4) DEFAULT NULL,
  `report_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `er_stage_product_inventory` (
  `product_id` int NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `meta_id` int NOT NULL,
  `current_stock_status` varchar(45) DEFAULT NULL,
  `new_stock_status` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE `er_stage_variation_inventory` (
  `variation_id` int NOT NULL,
  `product_id` int NOT NULL,
  `sku` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `meta_id` int NOT NULL,
  `current_stock_status` varchar(45) DEFAULT NULL,
  `new_stock_status` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `er_etl_history` (
  `timestamp` datetime NOT NULL,
  `table_name` varchar(255) DEFAULT NULL,
  `rows_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;













