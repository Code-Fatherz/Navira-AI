-- Delete Delhi traffic signals from database
DELETE FROM traffic_signals WHERE city = 'Delhi' OR city IS NULL;