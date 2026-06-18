require('dotenv').config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const db = require("./db");
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.send("PawSupport server running");
});

app.post("/register/donor", (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required" });
  db.query("CALL register_donor(?, ?, ?)", [name, email, password], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Donor registered successfully" });
  });
});

app.post("/register/ngo", (req, res) => {
  const { name, email, password, phone, city, reg_no } = req.body;
  if (!name || !email || !password || !phone || !city || !reg_no)
    return res.status(400).json({ error: "All fields are required" });
  db.query(
    "CALL register_ngo(?, ?, ?, ?, ?, ?)",
    [name, email, password, phone, city, reg_no],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "NGO registered successfully" });
    }
  );
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  db.query("CALL login_user(?, ?)", [email, password], (err, results) => {
    if (err) {
      if (err.sqlState === "45000")
        return res.status(401).json({ error: err.message });
      return res.status(500).json({ error: err.message });
    }
    const user = results[0][0];
    if (user.role === "donor") {
      db.query(
        "SELECT * FROM donors WHERE user_id = ?",
        [user.user_id],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ user, profile: rows[0] || null });
        }
      );
    } else if (user.role === "ngo") {
      db.query(
        "SELECT * FROM ngos WHERE user_id = ?",
        [user.user_id],
        (err2, rows) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ user, profile: rows[0] || null });
        }
      );
    } else {
      res.json({ user, profile: null });
    }
  });
});

app.post("/donor/update", (req, res) => {
  const { donor_id, age, city, address, contact_no } = req.body;
  db.query(
    "UPDATE donors SET age=?, city=?, address=?, contact_no=? WHERE donor_id=?",
    [age, city, address, contact_no, donor_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Profile updated" });
    }
  );
});

app.post("/donor/delete", (req, res) => {
  const { user_id } = req.body;
  db.query("DELETE FROM users WHERE user_id = ?", [user_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Account deleted" });
  });
});

app.get("/donor/stats/:donor_id", (req, res) => {
  const { donor_id } = req.params;
  db.query(
    `SELECT
       count_donations(?)        AS total_donations,
       total_donation_amount(?)  AS total_amount`,
    [donor_id, donor_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const stats = rows[0];
      db.query(
        "SELECT COUNT(*) AS delivered FROM donations WHERE donor_id = ? AND status = 'received'",
        [donor_id],
        (err2, r2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.query(
            "SELECT COUNT(*) AS adoption_count FROM adoption_requests WHERE donor_id = ?",
            [donor_id],
            (err3, r3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({
                total_donations: stats.total_donations,
                total_amount: stats.total_amount,
                delivered: r2[0].delivered,
                adoption_count: r3[0].adoption_count
              });
            }
          );
        }
      );
    }
  );
});

app.get("/ngos", (req, res) => {
  db.query("SELECT * FROM ngos", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get("/donation-requests", (req, res) => {
  const sql = `
    SELECT dr.*, n.name AS ngo_name, n.city AS ngo_city
    FROM donation_requests dr
    JOIN ngos n ON dr.ngo_id = n.ngo_id
    WHERE dr.status = 'open'
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/donate", (req, res) => {
  const { donor_id, ngo_id, donation_type, amount, description } = req.body;
  db.query(
    `INSERT INTO donations (donor_id, ngo_id, donation_type, amount, description)
     VALUES (?, ?, ?, ?, ?)`,
    [donor_id, ngo_id, donation_type, amount, description],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Donation successful" });
    }
  );
});

app.post("/donate/request", (req, res) => {
  const { donor_id, ngo_id, request_id, donation_type, amount } = req.body;
  db.query(
    `INSERT INTO donations (donor_id, ngo_id, request_id, donation_type, amount)
     VALUES (?, ?, ?, ?, ?)`,
    [donor_id, ngo_id, request_id, donation_type, amount],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Donation to request successful" });
    }
  );
});

app.get("/donations/:donor_id", (req, res) => {
  db.query(
    "SELECT * FROM donations WHERE donor_id = ?",
    [req.params.donor_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get("/animals", (req, res) => {
  const sql = `
    SELECT a.*, n.name AS ngo_name, n.city AS ngo_city
    FROM animals a
    JOIN ngos n ON a.ngo_id = n.ngo_id
    WHERE a.adoption_status = 'available'
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/adopt", (req, res) => {
  const { donor_id, animal_id, req_desc } = req.body;
  db.query(
    "INSERT INTO adoption_requests (donor_id, animal_id, req_desc) VALUES (?, ?, ?)",
    [donor_id, animal_id, req_desc],
    (err) => {
      if (err) {
        if (err.sqlState === "45000")
          return res.status(400).json({ error: err.message });
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Adoption request sent" });
    }
  );
});

app.get("/adoptions/:donor_id", (req, res) => {
  db.query(
    "SELECT * FROM adoption_requests WHERE donor_id = ?",
    [req.params.donor_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/ngo/update", (req, res) => {
  const { ngo_id, phone, city, address, about } = req.body;
  db.query(
    "UPDATE ngos SET phone=?, city=?, address=?, about=? WHERE ngo_id=?",
    [phone, city, address, about, ngo_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Profile updated" });
    }
  );
});

app.post("/ngo/delete", (req, res) => {
  const { user_id } = req.body;
  db.query("DELETE FROM users WHERE user_id = ?", [user_id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Account deleted" });
  });
});

app.get("/ngo/stats/:ngo_id", (req, res) => {
  const { ngo_id } = req.params;
  db.query(
    `SELECT
       ngo_request_count(?) AS total_requests`,
    [ngo_id],
    (err, r1) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query(
        "SELECT COUNT(*) AS pending FROM adoption_requests ar JOIN animals a ON ar.animal_id = a.animal_id WHERE a.ngo_id = ? AND ar.status = 'pending'",
        [ngo_id],
        (err2, r2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.query(
            "SELECT COUNT(*) AS total_animals FROM animals WHERE ngo_id = ?",
            [ngo_id],
            (err3, r3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              db.query(
                "SELECT COUNT(*) AS total_donations FROM donations WHERE ngo_id = ?",
                [ngo_id],
                (err4, r4) => {
                  if (err4) return res.status(500).json({ error: err4.message });
                  res.json({
                    total_requests:  r1[0].total_requests,
                    pending:         r2[0].pending,
                    total_animals:   r3[0].total_animals,
                    total_donations: r4[0].total_donations
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

app.get("/ngo/requests/:ngo_id", (req, res) => {
  db.query(
    "SELECT * FROM donation_requests WHERE ngo_id = ? ORDER BY created_at DESC",
    [req.params.ngo_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/ngo/requests/create", (req, res) => {
  const { ngo_id, title, description, request_type, quantity } = req.body;
  if (!ngo_id || !title || !request_type || !quantity)
    return res.status(400).json({ error: "All fields are required" });
  db.query(
    "INSERT INTO donation_requests (ngo_id, title, description, request_type, quantity) VALUES (?, ?, ?, ?, ?)",
    [ngo_id, title, description, request_type, quantity],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Request created" });
    }
  );
});

app.get("/ngo/donations/:ngo_id", (req, res) => {
  db.query(
    "SELECT * FROM donations WHERE ngo_id = ? ORDER BY created_at DESC",
    [req.params.ngo_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.get("/ngo/animals/:ngo_id", (req, res) => {
  db.query(
    "SELECT * FROM animals WHERE ngo_id = ? ORDER BY created_at DESC",
    [req.params.ngo_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post("/ngo/animals/add", (req, res) => {
  const { ngo_id, name, type, age, description, image_url } = req.body;
  if (!ngo_id || !name || !type)
    return res.status(400).json({ error: "ngo_id, name, and type are required" });
  db.query(
    "INSERT INTO animals (ngo_id, name, type, age, description, image_url) VALUES (?, ?, ?, ?, ?, ?)",
    [ngo_id, name, type, age || null, description || null, image_url || null],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Animal added" });
    }
  );
});

app.post("/ngo/animals/delete", (req, res) => {
  const { animal_id, ngo_id } = req.body;
  db.query(
    "DELETE FROM animals WHERE animal_id = ? AND ngo_id = ?",
    [animal_id, ngo_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Animal removed" });
    }
  );
});

app.get("/ngo/adoption-requests/:ngo_id", (req, res) => {
  const sql = `
    SELECT
      ar.request_id,
      ar.donor_id,
      ar.animal_id,
      ar.req_desc,
      ar.status,
      ar.request_date,
      ar.response_date,
      ar.remarks,
      a.name        AS animal_name,
      a.type        AS animal_type,
      d.name        AS donor_name,
      d.contact_no  AS donor_contact
    FROM adoption_requests ar
    JOIN animals a  ON ar.animal_id = a.animal_id
    JOIN donors  d  ON ar.donor_id  = d.donor_id
    WHERE a.ngo_id = ?
    ORDER BY ar.request_date DESC
  `;
  db.query(sql, [req.params.ngo_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/ngo/adoption-requests/respond", (req, res) => {
  const { request_id, status, remarks } = req.body;
  if (!["approved", "rejected"].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  db.query(
    `UPDATE adoption_requests
     SET status = ?, remarks = ?, response_date = NOW()
     WHERE request_id = ?`,
    [status, remarks || null, request_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      if (status === "approved") {
        db.query(
          "SELECT animal_id FROM adoption_requests WHERE request_id = ?",
          [request_id],
          (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            const animal_id = result[0].animal_id;
            db.query(
              `UPDATE adoption_requests
               SET status = 'rejected',
                   response_date = NOW(),
                   remarks = 'Auto-rejected: animal adopted by another donor'
               WHERE animal_id = ?
                 AND request_id != ?
                 AND status = 'pending'`,
              [animal_id, request_id],
              (err) => {
                if (err) return res.status(500).json({ error: err.message });
                return res.json({ message: "Adoption approved and others rejected" });
              }
            );
          }
        );
      } else {
        return res.json({ message: "Adoption rejected" });
      }
    }
  );
});

app.get("/ngo/donations/:ngo_id", (req, res) => {
  const sql = `
    SELECT
      don.donation_id,
      don.donor_id,
      don.ngo_id,
      don.donation_type,
      don.amount,
      don.description,
      don.status,
      don.created_at,
      don.request_id,
      dr.title      AS request_title,
      dr.status     AS request_status,
      d.name        AS donor_name
    FROM donations don
    LEFT JOIN donation_requests dr ON don.request_id = dr.request_id
    LEFT JOIN donors d             ON don.donor_id   = d.donor_id
    WHERE don.ngo_id = ?
    ORDER BY don.created_at DESC
  `;
  db.query(sql, [req.params.ngo_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/ngo/donations/update-status", (req, res) => {
  const { donation_id, status } = req.body;
  if (!['approved', 'rejected', 'received'].includes(status))
    return res.status(400).json({ error: "Invalid status" });
  db.query(
    "SELECT status, request_id FROM donations WHERE donation_id = ?",
    [donation_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!rows || rows.length === 0)
        return res.status(404).json({ error: "Donation not found" });
      const current    = rows[0].status;
      const request_id = rows[0].request_id;
      const allowed = {
        requested: ['approved', 'rejected'],
        approved:  ['received'],
        rejected:  [],
        received:  []
      };
      if (!(allowed[current] || []).includes(status))
        return res.status(400).json({
          error: `Cannot move from '${current}' to '${status}'`
        });
      db.query(
        "UPDATE donations SET status = ? WHERE donation_id = ?",
        [status, donation_id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          if (status === 'received' && request_id) {
            db.query(
              "UPDATE donation_requests SET status = 'fulfilled' WHERE request_id = ?",
              [request_id],
              (err3) => {
                if (err3) return res.status(500).json({ error: err3.message });
                res.json({ message: "Donation received & request fulfilled" });
              }
            );
          } else {
            res.json({ message: `Donation marked ${status}` });
          }
        }
      );
    }
  );
});

app.post("/ngo/requests/close", (req, res) => {
  const { request_id, ngo_id } = req.body;
  db.query(
    "UPDATE donation_requests SET status = 'closed' WHERE request_id = ? AND ngo_id = ?",
    [request_id, ngo_id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Request closed" });
    }
  );
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
