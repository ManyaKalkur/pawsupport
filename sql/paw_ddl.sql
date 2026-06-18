CREATE DATABASE paws;
USE paws;
CREATE TABLE users (
user_id INT AUTO_INCREMENT PRIMARY KEY,
email VARCHAR(255) NOT NULL,
password VARCHAR(255) NOT NULL,
role VARCHAR(10) NOT NULL,
CHECK (role IN ('donor', 'ngo'))
);

CREATE TABLE donors (
donor_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
name VARCHAR(100) NOT NULL,
age INT,
address TEXT,
city VARCHAR(100),
contact_no VARCHAR(15),
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE ngos (
ngo_id INT AUTO_INCREMENT PRIMARY KEY,
user_id INT,
name VARCHAR(100) NOT NULL,
phone VARCHAR(15),
address TEXT,
city VARCHAR(100) NOT NULL,
reg_no VARCHAR(50) NOT NULL UNIQUE,
about TEXT,
FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE donation_requests (
request_id INT AUTO_INCREMENT PRIMARY KEY,
ngo_id INT,
title VARCHAR(255),
description TEXT,
request_type VARCHAR(50),
quantity INT,
status VARCHAR(20) DEFAULT 'open',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id)
);

CREATE TABLE donations (
donation_id INT AUTO_INCREMENT PRIMARY KEY,
donor_id INT,
ngo_id INT,
donation_type VARCHAR(50),
amount INT,
description TEXT,
status VARCHAR(20) DEFAULT 'requested',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
request_id INT,
FOREIGN KEY (donor_id) REFERENCES donors(donor_id),
FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id),
FOREIGN KEY (request_id) REFERENCES donation_requests(request_id)
);

CREATE TABLE animals (
animal_id INT AUTO_INCREMENT PRIMARY KEY,
ngo_id INT,
name VARCHAR(100),
type VARCHAR(50) NOT NULL,
age INT,
gender VARCHAR(10),
description TEXT,
adoption_status VARCHAR(20) DEFAULT 'available',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
adopted_by INT,
image_url TEXT,
FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id),
FOREIGN KEY (adopted_by) REFERENCES donors(donor_id)
);

CREATE TABLE adoption_requests (
request_id INT AUTO_INCREMENT PRIMARY KEY,
donor_id INT,
animal_id INT,
req_desc TEXT,
status VARCHAR(20) DEFAULT 'pending',
request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
response_date TIMESTAMP NULL,
remarks TEXT,
FOREIGN KEY (donor_id) REFERENCES donors(donor_id),
FOREIGN KEY (animal_id) REFERENCES animals(animal_id)
);

ALTER TABLE donors DROP FOREIGN KEY donors_ibfk_1;
ALTER TABLE donors ADD CONSTRAINT donors_ibfk_1 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

ALTER TABLE ngos DROP FOREIGN KEY ngos_ibfk_1;
ALTER TABLE ngos ADD CONSTRAINT ngos_ibfk_1 
FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
  
ALTER TABLE animals DROP FOREIGN KEY animals_ibfk_1;
ALTER TABLE animals 
ADD CONSTRAINT animals_ibfk_1 
FOREIGN KEY (ngo_id) REFERENCES ngos(ngo_id) ON DELETE CASCADE;
ALTER TABLE animals DROP FOREIGN KEY animals_ibfk_2;
ALTER TABLE animals 
ADD CONSTRAINT animals_ibfk_2 
FOREIGN KEY (adopted_by) REFERENCES donors(donor_id) ON DELETE CASCADE;

ALTER TABLE adoption_requests DROP FOREIGN KEY adoption_requests_ibfk_1;
ALTER TABLE adoption_requests 
ADD CONSTRAINT adoption_requests_ibfk_1 
FOREIGN KEY (donor_id) REFERENCES donors(donor_id) ON DELETE CASCADE;
ALTER TABLE adoption_requests DROP FOREIGN KEY adoption_requests_ibfk_2;
ALTER TABLE adoption_requests 
ADD CONSTRAINT adoption_requests_ibfk_2 
FOREIGN KEY (animal_id) REFERENCES animals(animal_id) ON DELETE CASCADE;

ALTER TABLE donations DROP FOREIGN KEY donations_ibfk_1;
ALTER TABLE donations 
ADD CONSTRAINT donations_ibfk_1
FOREIGN KEY (donor_id) REFERENCES donors(donor_id)
ON DELETE CASCADE;

ALTER TABLE donation_requests
ADD CONSTRAINT chk_donation_requests_status
CHECK (status IN ('open', 'fulfilled', 'closed'));

ALTER TABLE donations
ADD CONSTRAINT chk_donations_status
CHECK (status IN ('requested', 'approved', 'rejected', 'received'));

ALTER TABLE animals
ADD CONSTRAINT chk_animals_status
CHECK (adoption_status IN ('available', 'adopted'));

ALTER TABLE adoption_requests
ADD CONSTRAINT chk_adoption_requests_status
CHECK (status IN ('pending', 'approved', 'rejected'));