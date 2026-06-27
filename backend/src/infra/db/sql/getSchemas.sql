select schema_name 
from information_schema.schemata 
where schema_name not in ('public', 'information_schema', 'pg_catalog', 'pg_toast')