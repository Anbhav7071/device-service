CREATE OR REPLACE FUNCTION create_transaction_entry()
RETURNS TRIGGER AS $$
DECLARE
    totalAmount FLOAT := 0;
    numericValue TEXT;
    commandLatency INTERVAL;
BEGIN
    -- Check if cmd is "DEVICE_SPEAK_TXN"
    IF NEW.cmd = 'DEVICE_SPEAK_TXN' THEN

        -- Loop through the numeric values in opts
        FOR numericValue IN SELECT value::TEXT FROM jsonb_array_elements_text(NEW.opts)
        LOOP
            BEGIN
                totalAmount := totalAmount + (numericValue::FLOAT);
            EXCEPTION
                WHEN others THEN
                    CONTINUE;
            END;    
        END LOOP;

        SELECT AGE(NEW."updated_at", NEW."created_at") INTO commandLatency;

        -- Check if the corresponding entry already exists in transactions
        IF EXISTS (
            SELECT 1
            FROM "public"."transactions"
            WHERE "commandId" = NEW."id"
        ) THEN
            -- Update existing entry
            UPDATE "public"."transactions"
            SET 
                "latency" = commandLatency,
                "updated_at" = NOW()
            WHERE "commandId" = NEW."id";
        ELSE
            -- Insert new entry using optimized JOIN with branches table
            INSERT INTO "public"."transactions" (
                "commandId", "amount", "device_id", "organization_id",
                "region", "zone", "name", "branch",
                "state", "city", "pincode", "merchant_id", "vpa", "language",
                "latency" 
            )
            SELECT
                NEW."id", totalAmount, NEW."device_id", NEW."organization_id",
                COALESCE(b."regional_office_name", m.region) as region,
                COALESCE(b."zone_office_name", '') as zone,
                m.name, m."branch_id",
                m.state, m.city, m.pincode, 
                m.id, m.vpa, m.language,
                commandLatency 
            FROM 
                "public"."merchants" m
                LEFT JOIN "public"."branches" b ON m."branch_id" = b."branch_id" 
                    AND b."organization_id" = m."organization_id"
            WHERE 
                m."device_id" = NEW."device_id"
                AND m."organization_id" = NEW."organization_id"
            LIMIT 1;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute create_transaction_entry after insert or update on commandlogs
CREATE OR REPLACE TRIGGER trigger_create_transaction_entry
AFTER INSERT OR UPDATE ON "public"."mqttcommandlogs"
FOR EACH ROW 
EXECUTE FUNCTION create_transaction_entry();