const sql = require('mssql');

async function createDbConnection(server, database, user_name, user_password) {
    try {
        const pool = await sql.connect({
            user: user_name,
            password: user_password,
            server: server,
            database: database,
            options: {
                encrypt: true, // Use this option if connecting to Azure SQL Database
                trustServerCertificate: false,
            },
        });

        console.log("Azure SQL Database connection successful");
        return pool;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        return null;
    }
}

async function tableSelect(connection, table_name) {
    try {
        const request = connection.request();

        // Define the SQL query to select all rows from a specific table
        const selectQuery = `SELECT * FROM ${table_name};`;

        // Execute the query
        const result = await request.query(selectQuery);

        return result.recordset;
    } catch (e) {
        console.error(`Error in tableSelect: ${e.message}`);
        return null;
    }
}
async function save_known_kanji(connection, user_id, kanji) {
    let success = false; // Initialize the success indicator
    try {
        if (kanji !== null) {
            const request = connection.request();
            const id = Math.floor(Math.random() * 100000) + 1;

            // Convert the array of kanji to a comma-separated string
            //const kanjiString = kanji.join(', ');

            // Define the SQL query to insert data into the table
            const insertQuery = `
                INSERT INTO known_kanji (id, user_id, kanji) VALUES (@id, @user_id, @kanji);
            `;

            // Execute the query with user_id and kanji as parameters
            request.input('id', id);
            request.input('user_id', user_id);
            request.input('kanji', kanji);
            await request.query(insertQuery);

            console.log(`Saved kanji: ${kanji}`);
            success = true; // Indicate success
        } else {
            console.log("Ignoring null kanji.");
        }
    } catch (e) {
        console.error(`An error occurred while saving kanji: ${e.message}`);
    }

    return success; // Return the success indicator
}

async function get_known_kanji(connection, user_id) {
    try {
        const request = connection.request();

        console.log("We are here right now in the database" + user_id);

        // Define the SQL query to fetch known kanji for a specific user
        const selectQuery = `
            SELECT DISTINCT kanji FROM known_kanji WHERE user_id = @user_id;
        `;

        // Execute the query with the user_id as a parameter
        request.input('user_id', user_id);
        const result = await request.query(selectQuery);

        // Extract kanji values from the result set
        const known_kanji_list = result.recordset.map(row => row.kanji);

        // Print a message to indicate that the query was successful
        console.log("Query executed successfully");

        // Iterate over the result and print each kanji
        known_kanji_list.forEach(kanji => {
            console.log(`Kanji: ${kanji}`);
        });

        return known_kanji_list;

    } catch (e) {
        console.error(`An error occurred while fetching known kanji: ${e.message}`);
        return [];
    }
}

module.exports = {
    createDbConnection,
    tableSelect,
    save_known_kanji,
    get_known_kanji
};