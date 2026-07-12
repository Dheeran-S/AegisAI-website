require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'aegisai',
  });

  try {
    console.log('Connecting to database...');
    
    // Check if page already exists
    const [existing] = await pool.query('SELECT id FROM pages WHERE slug = ?', ['committee']);
    let pageId;
    
    if (existing.length > 0) {
      console.log('Page "committee" already exists, deleting existing sections...');
      pageId = existing[0].id;
      await pool.query('DELETE FROM sections WHERE page_id = ?', [pageId]);
    } else {
      console.log('Creating new page "committee"...');
      const [maxOrder] = await pool.query('SELECT MAX(nav_order) as m FROM pages');
      const navOrder = (maxOrder[0].m || 0) + 1;
      
      const [result] = await pool.query(
        'INSERT INTO pages (slug, title, meta_description, nav_order) VALUES (?, ?, ?, ?)',
        ['committee', 'Committee', 'AegisAI 2027 Committee Members', navOrder]
      );
      pageId = result.insertId;
    }

    console.log('Inserting committee data in 3 sections...');
    
    const section1 = {
      groups: [
        {
          role: "General Chair",
          members: [
            { name: "Dr. T. Nagarajan", affiliation: "Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" }
          ]
        },
        {
          role: "General Co-Chairs",
          members: [
            { name: "Dr. Jiji C V", affiliation: "Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. S. Chandrakala", affiliation: "Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. Sakthi Balan Muthiah", affiliation: "Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" }
          ]
        }
      ]
    };

    const section2 = {
      groups: [
        {
          role: "Convenors",
          members: [
            { name: "Dr. Rourab Paul", affiliation: "Assistant Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. Nimisha Ghosh", affiliation: "Assistant Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. Priya G. L.", affiliation: "Assistant Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. Debajyoti Biswas", affiliation: "Assistant Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" }
          ]
        }
      ]
    };

    const section3 = {
      groups: [
        {
          role: "Technical Program Committee",
          members: [
            { name: "Prof. Marco Danelutto", affiliation: "Professor, Dept. of Computer Science<br>University of Pisa, Italy" },
            { name: "Prof. Sandeep Shukla", affiliation: "Professor, Director<br>International Institute of Information Technology (IIIT) Hyderabad" },
            { name: "Prof. Amlan Chakrabarti", affiliation: "Professor, Director, School of IT<br>University of Calcutta" },
            { name: "Dr. Krishnendu Guha", affiliation: "Assistant Professor, School of Computer Science and Information Technology<br>University College Cork (UCC), Ireland" },
            { name: "Dr. Santhi Natarajan", affiliation: "Associate Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. K.B. Sundhara Kumar", affiliation: "Associate Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. S. Vidhusha", affiliation: "Associate Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" },
            { name: "Dr. S. Veeramani", affiliation: "Associate Professor, Computer Science and Engineering<br>Shiv Nadar University Chennai" }
          ]
        }
      ]
    };

    await pool.query(
      'INSERT INTO sections (page_id, type, section_order, data) VALUES (?, ?, ?, ?)',
      [pageId, 'committee_group', 1, JSON.stringify(section1)]
    );
    await pool.query(
      'INSERT INTO sections (page_id, type, section_order, data) VALUES (?, ?, ?, ?)',
      [pageId, 'committee_group', 2, JSON.stringify(section2)]
    );
    await pool.query(
      'INSERT INTO sections (page_id, type, section_order, data) VALUES (?, ?, ?, ?)',
      [pageId, 'committee_group', 3, JSON.stringify(section3)]
    );

    console.log('Successfully inserted committee data into 3 sections!');
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
