-- Enable Row Level Security on tables
ALTER TABLE "customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "booking" ENABLE ROW LEVEL SECURITY;

-- Create policies for customer table
CREATE POLICY "customer_tenant_isolation" ON "customer"
    FOR ALL
    USING ("tenantId" = current_setting('app.current_tenant', true));

-- Create policies for booking table  
CREATE POLICY "booking_tenant_isolation" ON "booking"
    FOR ALL
    USING ("tenantId" = current_setting('app.current_tenant', true));

-- Create a function to set the current tenant context
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_id, true);
END;
$$ LANGUAGE plpgsql;

-- Create a function to get the current tenant
CREATE OR REPLACE FUNCTION get_current_tenant()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.current_tenant', true);
END;
$$ LANGUAGE plpgsql;
