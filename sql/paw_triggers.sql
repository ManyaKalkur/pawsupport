--Set status='requested' before every new donation
CREATE TRIGGER before_donation_insert
BEFORE INSERT ON donations
FOR EACH ROW
SET NEW.status= 'requested';

--When adoption request approved then mark animal as adopted
DELIMITER //
CREATE TRIGGER after_adoption_update
AFTER UPDATE ON adoption_requests
FOR EACH ROW
BEGIN
  IF NEW.status= 'approved' AND OLD.status != 'approved' THEN
    UPDATE animals
    SET adopted_by= NEW.donor_id,
        adoption_status= 'adopted'
    WHERE animal_id= NEW.animal_id;
  END IF;
END //
DELIMITER ;

--Block duplicate NGO reg_no
DELIMITER //
CREATE TRIGGER before_ngo_insert
BEFORE INSERT ON ngos
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM ngos WHERE reg_no= NEW.reg_no
  ) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT= 'NGO with this registration number already exists';
  END IF;
END //
DELIMITER ;

--Block adoption request if animal is not available
DELIMITER //
CREATE TRIGGER before_adoption_insert
BEFORE INSERT ON adoption_requests
FOR EACH ROW
BEGIN
  DECLARE status_val VARCHAR(20);
  SELECT adoption_status INTO status_val
  FROM animals
  WHERE animal_id= NEW.animal_id;

  IF status_val IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT= 'Animal not found';
  END IF;

  IF status_val != 'available' THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT= 'Animal is not available for adoption';
  END IF;
END //
DELIMITER ;
