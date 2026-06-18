DELIMITER //
CREATE FUNCTION get_user_role(p_user_id INT)
RETURNS VARCHAR(10)
DETERMINISTIC
BEGIN
 DECLARE v_role VARCHAR(10);
 SELECT role INTO v_role
 FROM users
 WHERE user_id= p_user_id;
 RETURN v_role;
END //
DELIMITER ;

DELIMITER //
CREATE FUNCTION count_donations(p_donor_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
 DECLARE total INT;
 SELECT COUNT(*) INTO total
 FROM donations
 WHERE donor_id= p_donor_id;
 RETURN total;
END //
DELIMITER ;

DELIMITER //
CREATE FUNCTION is_animal_available(p_animal_id INT)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
 DECLARE status_val VARCHAR(20);
 SELECT adoption_status INTO status_val
 FROM animals
 WHERE animal_id= p_animal_id;
 RETURN status_val= 'available';
END //
DELIMITER ;

DELIMITER //
CREATE FUNCTION total_donation_amount(p_donor_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
  DECLARE total INT;
  SELECT IFNULL(SUM(amount), 0) INTO total
  FROM donations
  WHERE donor_id= p_donor_id
    AND donation_type= 'money';
  RETURN total;
END //
DELIMITER ;

DELIMITER //
CREATE FUNCTION ngo_request_count(p_ngo_id INT)
RETURNS INT
DETERMINISTIC
BEGIN
 DECLARE total INT;
 SELECT COUNT(*) INTO total
 FROM donation_requests
 WHERE ngo_id= p_ngo_id;
 RETURN total;
END //
DELIMITER ;



