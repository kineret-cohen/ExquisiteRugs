
drop table er_stage_inventory;
CREATE TABLE `er_stage_inventory` (
  `item` varchar(127) DEFAULT NULL,
  `design` varchar(255) DEFAULT NULL,
  `in_stock` int DEFAULT NULL,
  `in_transit` int DEFAULT NULL,
  `in_transit_eta` varchar(255) DEFAULT NULL,
  `on_loom` int DEFAULT NULL,
  `on_loom_eta` varchar(31) DEFAULT NULL,
  `size` varchar(63) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


drop table er_inventory;
CREATE TABLE `er_inventory` (
  `design` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `in_stock` int DEFAULT NULL,
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
  `current_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;


CREATE TABLE `er_etl_history` (
  `timestamp` datetime NOT NULL,
  `table_name` varchar(255) DEFAULT NULL,
  `rows_updated` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;













