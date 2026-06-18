DELIMITER //
CREATE PROCEDURE register_donor(
 IN p_name VARCHAR(100),
 IN p_email VARCHAR(100),
 IN p_password VARCHAR(100)
)
BEGIN
 DECLARE uid INT;
 INSERT INTO users(email,password,role)
 VALUES (p_email, p_password, 'donor');
 SET uid= LAST_INSERT_ID();
 INSERT INTO donors(user_id, name)
 VALUES (uid, p_name);
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE register_ngo(
 IN p_name VARCHAR(100),
 IN p_email VARCHAR(100),
 IN p_password VARCHAR(100),
 IN p_phone VARCHAR(15),
 IN p_city VARCHAR(100),
 IN p_reg_no VARCHAR(50)
)
BEGIN
 DECLARE uid INT;
 INSERT INTO users(email, password, role)
 VALUES (p_email, p_password, 'ngo');
 SET uid= LAST_INSERT_ID();
 INSERT INTO ngos(user_id, name,phone,city, reg_no)
 VALUES (uid, p_name,p_phone,p_city,p_reg_no);
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE login_user(
 IN p_email VARCHAR(100),
 IN p_password VARCHAR(100)
)
BEGIN
 DECLARE v_user_id INT;
 DECLARE v_password VARCHAR(100);
 DECLARE v_role VARCHAR(10);
 DECLARE v_email VARCHAR(100);
 SELECT user_id, email, password, role
 INTO v_user_id, v_email, v_password, v_role
 FROM users
 WHERE email= p_email
 LIMIT 1;
 IF v_user_id IS NULL THEN
   SIGNAL SQLSTATE '45000'
   SET MESSAGE_TEXT= 'User not found';
 END IF;
 IF v_password != p_password THEN
   SIGNAL SQLSTATE '45000'
   SET MESSAGE_TEXT= 'Invalid password';
 END IF;
 SELECT v_user_id AS user_id,
        v_email   AS email,
        v_role    AS role;
END //
DELIMITER ;