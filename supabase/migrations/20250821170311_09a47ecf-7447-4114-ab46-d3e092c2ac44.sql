-- Insert sample tracking data for the current week to demonstrate charts
-- Get the current user's pills and add sample tracking data

DO $$
DECLARE
    pill_record RECORD;
    current_date DATE;
    i INTEGER;
BEGIN
    -- Loop through all pills for user
    FOR pill_record IN 
        SELECT id, dose1_time, dose2_time, dose3_time 
        FROM public.pills 
        WHERE user_id = '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee'
    LOOP
        -- Create tracking data for the past 7 days
        FOR i IN 0..6 LOOP
            current_date := CURRENT_DATE - i;
            
            -- Calculate scheduled doses for this pill
            DECLARE
                scheduled_doses INTEGER := 0;
                taken_pills INTEGER;
            BEGIN
                IF pill_record.dose1_time IS NOT NULL THEN 
                    scheduled_doses := scheduled_doses + 1; 
                END IF;
                IF pill_record.dose2_time IS NOT NULL THEN 
                    scheduled_doses := scheduled_doses + 1; 
                END IF;
                IF pill_record.dose3_time IS NOT NULL THEN 
                    scheduled_doses := scheduled_doses + 1; 
                END IF;
                
                -- Random taken pills (0 to scheduled_doses)
                taken_pills := FLOOR(RANDOM() * (scheduled_doses + 1));
                
                -- Insert or update tracking record
                INSERT INTO public.tracking (
                    id, 
                    user_id, 
                    date, 
                    taken, 
                    to_be_taken, 
                    skipped,
                    first_intake,
                    second_intake,
                    third_intake
                ) VALUES (
                    pill_record.id,
                    '64c999ab-c5aa-4c4c-8ba5-ee8ef1ed5fee',
                    current_date,
                    taken_pills,
                    scheduled_doses - taken_pills,
                    0,
                    CASE WHEN taken_pills >= 1 AND pill_record.dose1_time IS NOT NULL THEN 
                        current_date + pill_record.dose1_time::TIME 
                    END,
                    CASE WHEN taken_pills >= 2 AND pill_record.dose2_time IS NOT NULL THEN 
                        current_date + pill_record.dose2_time::TIME 
                    END,
                    CASE WHEN taken_pills >= 3 AND pill_record.dose3_time IS NOT NULL THEN 
                        current_date + pill_record.dose3_time::TIME 
                    END
                ) ON CONFLICT (id, user_id, date) DO UPDATE SET
                    taken = EXCLUDED.taken,
                    to_be_taken = EXCLUDED.to_be_taken,
                    first_intake = EXCLUDED.first_intake,
                    second_intake = EXCLUDED.second_intake,
                    third_intake = EXCLUDED.third_intake;
            END;
        END LOOP;
    END LOOP;
END $$;