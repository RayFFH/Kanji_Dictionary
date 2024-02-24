const express = require('express');
const path = require('path');
var createError = require('http-errors');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const puppeteer = require('puppeteer');
const { createDbConnection, tableSelect, get_known_kanji, save_known_kanji } = require('./database');

var app = express();

app.use(cors());

app.options('*', cors());

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Set the 'views' directory to be 'views'
app.set('views', path.join(__dirname, 'views'));

// Serve the index.html file using the 'ejs' engine
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// // Render the index page
// app.get('/', function(req, res) {
//   res.render('index');
// });

// Catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// Error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;



// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;



// const express = require('express');
//const fs = require('fs');
const axios = require('axios');
// const app = express();
// // const port = 3002;
// const path = require('path');
// const mysql = require('mysql2'); 
//const bodyParser = require('body-parser');
//const crypto = require('crypto');
// //const { save_known_kanji, get_known_kanji } = require('./database');

// //const { getUserByUsername } = require('./database-module');

// const cors = require('cors');
// app.use(cors());
// app.use(express.json());
// app.set('view engine', 'ejs'); // Set EJS as the view engine
// app.set('views', path.join(__dirname, 'views'));
// app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory
// app.use('/views', express.static(path.join(__dirname, 'views')));
// app.use(express.static(path.join(__dirname, 'public')));

// // Middleware to read the API key
// // app.use((req, res, next) => {
// //     const filePath = 'API.txt';
// //     fs.readFile(filePath, 'utf8', (err, apiKey) => {
// //         if (err) {
// //             console.error('Error reading file:', err);
// //             res.status(500).send('Internal Server Error');
// //             return;
// //         }
// //         req.apiKey = apiKey.trim();
// //         next();
// //     });
// // });
// function create_db_connection(host_name, user_name, user_password, db_name) {
//     // Create a connection pool
//     const pool = mysql.createPool({
//         host: host_name,
//         user: user_name,
//         password: user_password,
//         database: db_name,
//         waitForConnections: true,
//         connectionLimit: 10,
//         queueLimit: 0
//     });

//     // Return the pool for reuse
//     return pool.promise();
// }

// module.exports = create_db_connection;

// Route to render the EJS file
app.get('/', (req, res) => {
    console.log('Rendering index.ejs');
    res.render('index',);
});

// // Route to fetch weather data from the Python server
// app.get('/getWeather', async (req, res) => {
//     try {
//         const response = await axios.get('http://localhost:5000/weather');
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error fetching weather data:', error);
//         res.status(500).send('Internal Server Error');
//     }
// });
app.get('/getRandomKanji', async (req, res) => {
    try {
        // Retrieve all kanji from the database
        const connection = await createDbConnection("kanjidatabaseserver.database.windows.net", "KanjiDatabase", "phoenix", "dsuJDS43280$£$");
        const kanjiList = await tableSelect(connection, "kanji");

        // Choose a random kanji from the list
        const randomIndex = Math.floor(Math.random() * kanjiList.length);
        const randomKanji = kanjiList[randomIndex];


        // Check if randomKanji is undefined
        if (!randomKanji) {
            return res.status(404).json({ error: 'No kanji found in the database' });
        }

        // Adjust the property access if needed
        const randomSentence = get_random_sentence_for_kanji(randomKanji.value);
        console.log(randomKanji)
        // Return random kanji data as JSON
        return res.json({ randomKanji, randomSentence });
    } catch (error) {
        // Log the error for further analysis
        console.error(`An error occurred: ${error}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/users', async (req, res) => {
    try {
        const data = req.body;
        const { username, password } = data;
        console.log("Trying to create user");

        const connection = await createDbConnection("kanjidatabaseserver.database.windows.net", "KanjiDatabase", "phoenix", "dsuJDS43280$£$");

        if (connection) {
            const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

            const request = connection.request();
            const query = "INSERT INTO users (username, password_hash) VALUES (@username, @passwordHash)";
            request.input('username', username);
            request.input('passwordHash', passwordHash);

            await request.query(query);

            connection.close();

            return res.status(201).json({ message: 'User created successfully', user_id: request.lastRowId });
        } else {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error(`An error occurred during user registration: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/getLogin', async (req, res) => {
    try {
        const data = req.body;
        const { username, password } = data;

        const connection = await createDbConnection("kanjidatabaseserver.database.windows.net", "KanjiDatabase", "phoenix", "dsuJDS43280$£$");

        if (connection) {
            const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

            const request = connection.request();
            const query = "SELECT * FROM users WHERE username = @username AND password_hash = @passwordHash";
            request.input('username', username);
            request.input('passwordHash', passwordHash);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                connection.close();
                return res.status(200).json({ message: 'Login successful' });
            } else {
                connection.close();
                return res.status(401).json({ error: 'Invalid username or password' });
            }
        } else {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } catch (error) {
        console.error(`An error occurred during user login: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.get('/getUser', async (req, res) => {
//     const username = req.query.username;

//     // Send a request to the Python server to get the username
//     try {
//         const pythonResponse = await axios.get(`https://pythonkanji.azurewebsites.net/getUsername?username=${username}`);
        
//         if (pythonResponse.status === 200) {
//             const pythonUsername = pythonResponse.data;
//             console.log('Username from Python:', pythonUsername);

//             res.status(200).json({ username: pythonUsername });
//         } else {
//             console.error('Failed to fetch username from Python:', pythonResponse.statusText);
//             res.status(500).json({ error: 'Internal Server Error' });
//         }
//     } catch (error) {
//         console.error('Error fetching username from Python:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

app.get('/getUser', (req, res) => {
    try {
        // Get the user_id from the request parameters
        const user_id = req.query.username;
        console.log("here" + user_id);

        if (user_id) {
            // Call the function to get the username
            const username = get_username_by_id(user_id);

            if (username) {
                return res.json({ username });
            } else {
                return res.status(404).json({ message: 'User not found' });
            }
        } else {
            return res.status(400).json({ error: 'Missing user_id parameter' });
        }
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/getKnownKanji', async (req, res) => {
    try {
        // Get user_id from the request
        const user_id = req.query.user_id;
        console.log("knownkanjiuserid" + user_id);

        // Fetch known kanji from the database
        const connection = await createDbConnection("kanjidatabaseserver.database.windows.net", "KanjiDatabase", "phoenix", "dsuJDS43280$£$");
        const known_kanji_list = await get_known_kanji(connection, user_id);

        // Return the list of known kanji
        // console.log(known_kanji_list);
        return res.status(200).json(known_kanji_list);
    } catch (error) {
        console.error(`An error occurred: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/recognizeKanji', async (req, res) => {
    try {
        // Log the received request body
        console.log(req.body);

        const user_id = req.body.user_id;
        console.log(`Received user_id: ${user_id}`);

        // Get random_kanji from the request
        // Assuming you have an element with the ID 'random-kanji' in your HTML
        const random_kanji = req.body.random_kanji;
        console.log(`Received random_kanji: ${random_kanji}`);

        // Save the recognized kanji to the database
        const connection = await createDbConnection("kanjidatabaseserver.database.windows.net", "KanjiDatabase", "phoenix", "dsuJDS43280$£$");

        if (connection) {
            // Save the recognized kanji to the database
            await save_known_kanji(connection, user_id, random_kanji);
            console.log("Now getting kanji");

            // Fetch and return the updated list of known kanji
            const known_kanji_list = await get_known_kanji(connection, user_id);
            console.log("Got known kanji:", known_kanji_list);

            return res.status(200).json(known_kanji_list);
        } else {
            return res.status(500).json({ error: 'Database Connection Failed' });
        }
    } catch (error) {
        // Log the exception for further analysis
        console.error(`An error occurred: ${error.message}`);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});




app.get('/getWanikanilevel', async (req, res) => {
    try {
        // Assuming you have the current kanji available in req.query.current_kanji
        const currentlevel = req.query.level;
        console.log("HERHERHEHSHHERRHE"+ currentlevel)
        // Make a GET request to the Flask server to get NHK news
        const response = await axios.get(`https://pythonkanji.azurewebsites.net/getWanikanilevel?currentlevel=${currentlevel}`);

        // Forward the NHK news data to the client
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Error fetching wanikanilevel:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.post('/saveKnownKanji', async (req, res) => {
//     try {
//         const response = await axios.post('http://localhost:5000/saveKnownKanji', {
//             user_id: req.body.user_id,
//             kanji: req.body.kanji,
//         });
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error saving known kanji:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// // app.get('/getKnownKanji', async (req, res) => {
// //     try {
// //         // const user_id = req.query.user_id;
// //         // // const knownKanjiList = await get_known_kanji(user_id);
// //         // // res.status(200).json(knownKanjiList);
// //         const response = await axios.get('http://localhost:5000/getKnownKanji');
// //         //console.log(response)
// //         res.json(response.data);
// //     } catch (error) {
// //         console.error('Error fetching known kanji:', error);
// //         res.status(500).json({ error: 'Internal Server Error' });
// //     }
// // });

// app.get('/getKnownKanji', async (req, res) => {
//     try {
//         const user_id = req.query.user_id; // Retrieve user_id from query parameters
//         const response = await axios.get(`http://localhost:5000/getKnownKanji?user_id=${user_id}`);
//         res.json(response.data);
//     } catch (error) {
//         console.error('Error fetching known kanji:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.post('/recognizeKanji', async (req, res) => {
//     try {
//         // Assuming you have an element with the ID 'random-kanji' in your HTML
//         // const randomKanjiElement = document.getElementById('random-kanji');
    
//         // Get the currently displayed random kanji
//         // const randomKanji = randomKanjiElement.textContent;
    
//         // Make a request to the server to recognize and save known kanji
//         const response = await axios.post('http://localhost:5000/recognizeKanji', {
//             user_id: req.body.user_id,  // Replace with the actual user ID
//             random_kanji: req.body.random_kanji,
//         });

//         try {
//             if (response.status === 200) {
//                 const knownKanjiList = response.data;
//                 //const actualKanjiList = knownKanjiList.kanji;
//                 console.log('Recognized kanji and updated known kanji list:', knownKanjiList);
    
//                 // Assuming you want to update the UI with the known kanji list
//                 // You can replace this part with your UI update logic
//                 // For example, updating a list on the web page
//                 // const knownKanjiListElement = document.getElementById('known-kanji-list');
//                 // knownKanjiListElement.innerHTML = '';
//                 // knownKanjiList.forEach(knownKanji => {
//                     // try {
//                     //     const listItem = document.createElement('li');
//                     //     listItem.textContent = knownKanji.kanji;
//                     //     knownKanjiListElement.appendChild(listItem);
//                     // } catch (innerError) {
//                     //     console.error('Error updating UI with known kanji:', innerError);
//                     // }
//                 // });
//                 res.json(knownKanjiList);

//             } else {
//                 console.error('Failed to recognize kanji:', response.statusText);
//                 // Handle the error, e.g., display an error message to the user
//             }
//         } catch (error) {
//             console.error('Error handling response:', error);
//         }
//     } catch (error) {
//         console.error('Error recognizing kanji:', error);
//         // Handle the error, e.g., display an error message to the user
//     }
// });


// app.post('/dontRecognizeKanji', async (req, res) => {
//     // Implement the logic for non-recognition of kanji
//     // ...
// });


// app.get('/getUser', async (req, res) => {
//     const username = req.query.username;

//     // Send a request to the Python server to get the username
//     try {
//         const pythonResponse = await axios.get(`http://localhost:5000/getUsername?username=${username}`);
        
//         if (pythonResponse.status === 200) {
//             const pythonUsername = pythonResponse.data;
//             console.log('Username from Python:', pythonUsername);

//             res.status(200).json({ username: pythonUsername });
//         } else {
//             console.error('Failed to fetch username from Python:', pythonResponse.statusText);
//             res.status(500).json({ error: 'Internal Server Error' });
//         }
//     } catch (error) {
//         console.error('Error fetching username from Python:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.post('/getUserLogin', async (req, res) => {
//     const username = req.body.username;
//     const password = req.body.username;

//     // Send a request to the Python server to get the username
//     try {
//         const pythonResponse = await axios.post(`http://localhost:5000/getLogin`, {
//             username,
//             password,
//         });
        
//         if (pythonResponse.status === 200) {
//             const pythonUsername = pythonResponse.data;
//             console.log('Username from Python:', pythonUsername);

//             res.status(200).json({ username: pythonUsername });
//         } else {
//             console.error('Failed to fetch username from Python:', pythonResponse.statusText);
//             res.status(500).json({ error: 'Internal Server Error' });
//         }
//     } catch (error) {
//         console.error('Error fetching username from Python:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// // app.post('/login', (req, res) => {
// //     const connection = create_db_connection("localhost", "root", "349dsahoDSI3:", "testdatabase");

// //     const { username, password } = req.body;

// //     // Hash the password (using a secure method in production)
// //     const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  
// //     // Check if the user exists
// //     const query = 'SELECT * FROM users WHERE username = ? AND password_hash = ?';
// //     connection.query(query, [username, passwordHash], (err, results) => {
// //       if (err) {
// //         console.error('Error executing login query:', err);
// //         res.status(500).json({ error: 'Internal Server Error' });
// //       } else {
// //         if (results.length > 0) {
// //           // User authenticated successfully
// //           res.status(200).json({ message: 'Login successful', user: results[0] });
// //         } else {
// //           // Incorrect username or password
// //           res.status(401).json({ error: 'Invalid username or password' });
// //         }
// //       }
  
// //       // Close the connection after the query is done
// //       connection.end();
// //     });
// //   });

// app.post('/users', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         // Make a request to the Python Flask function for user authentication
//         const pythonResponse = await axios.post('http://localhost:5000/users', {
//             username,
//             password,
//         });

//         // Forward the response from the Python Flask function to the client
//         res.status(pythonResponse.status).json(pythonResponse.data);
//     } catch (error) {
//         console.error('Error during login:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// // async function getUserByUsername(username) {
// //     const connection = create_db_connection("localhost", "root", "349dsahoDSI3:", "testdatabase");

    

// //     if (connection) {
// //         // Implement logic to query the database for the user by username
// //         // ...

// //         // For example, you might use a SQL query to fetch the user
// //         const query = "SELECT * FROM users WHERE username = ?";
// //         const [user] = await connection.execute(query, [username]);

// //         connection.end();

// //         return user;
// //     } else {
// //         // Handle the case where the database connection fails
// //         return null;
// //     }
// // }
// app.get('/getNHKNews', async (req, res) => {
//     try {
//         // Assuming you have the current kanji available in req.query.current_kanji
//         const currentKanji = req.query.randomKanji;
//         console.log("HERHERHEHSHHERRHE"+ currentKanji)
//         // Make a GET request to the Flask server to get NHK news
//         const response = await axios.get(`http://localhost:5000/getNHKNews?current_kanji=${currentKanji}`);

//         // Forward the NHK news data to the client
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error('Error fetching NHK news:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

// app.get('/getWanikanilevel', async (req, res) => {
//     try {
//         // Assuming you have the current kanji available in req.query.current_kanji
//         const currentlevel = req.query.level;
//         console.log("HERHERHEHSHHERRHE"+ currentlevel)
//         // Make a GET request to the Flask server to get NHK news
//         const response = await axios.get(`http://localhost:5000/getWanikanilevel?currentlevel=${currentlevel}`);

//         // Forward the NHK news data to the client
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error('Error fetching wanikanilevel:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });

//const port = process.env.PORT || 3002  // Use the provided port or default to 3001
async function get_username_by_id(user_id) {
    // Establish a database connection
    const connection = await createDbConnection("kanjidatabaseserver.database.windows.net", "KanjiDatabase", "phoenix", "dsuJDS43280$£$");

    try {
        const request = connection.request();

        console.log("Retrieving username" + user_id);

        // Execute the SQL query to retrieve the username by user_id
        const query = "SELECT * FROM users WHERE username = @user_id";
        request.input('user_id', user_id);

        const result = await request.query(query);

        if (result.recordset.length > 0) {
            console.log("the user returned");
            console.log(result.recordset[0].username);
            return result.recordset[0].username; // Return the username
        } else {
            console.log("no user");
            return null; // User not found
        }
    } catch (e) {
        console.error(`Error in get_username_by_id: ${e.message}`);
        return null;
    } finally {
        connection.close();
    }
}
const kanji_templates = {
    
};

function get_random_sentence_for_kanji(kanji) {
    // Check if the kanji is in the templates
    if (kanji in kanji_templates) {
        // Get the templates for the specified kanji
        const templates_for_kanji = kanji_templates[kanji];

        // Pick a random sentence from the templates
        const randomIndex = Math.floor(Math.random() * templates_for_kanji.length);
        const randomSentence = templates_for_kanji[randomIndex];

        return randomSentence;
    } else {
        return "No templates available for this kanji.";
    }
}

async function getNhkArticle(kanji) {
    browser = await puppeteer.launch();
    try {
        // NHK Easy News URL with the current kanji
        const nhkUrl = `https://www3.nhk.or.jp/news/nsearch/?col=news&charset=utf-8&qi=3&qt=${kanji}`;
        //const nhkUrl = `https://example.com`;

        // Launch a headless browser
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigate to the NHK Easy News URL
        await page.goto(nhkUrl);

        // Wait for some time to let the page load (adjust as needed)
        await new Promise(r => setTimeout(r, 5000))
        await page.waitForSelector('section.search--items');

        // Get the page content after JavaScript has executed
        const pageContent = await page.content();
        console.log('Page Content:', pageContent);
        // Close the browser
        //

        // Parse the HTML content of the page
        const searchItemsSection = await page.$eval('section.search--items', section => section.innerHTML);
        
        if (searchItemsSection) {
            // Extract and concatenate the text from each search note
            const articleText = await page.$$eval('li', listItems => {
                return listItems.map(item => {
                    const searchNote = item.querySelector('p.search-note');
                    return searchNote ? searchNote.textContent.trim() : '';
                }).join('\n');
            });

            return articleText.trim();  // Strip leading/trailing whitespaces
        } else {
            return "No search items found on the page.";
        }
    } catch (e) {
        console.error(`An error occurred during NHK Easy News scraping: ${e.message}`);
        return "Failed to retrieve NHK Easy News article.";
    }
        finally {
        await browser.close();
    }
}

// Route to get NHK Easy News article
app.get('/getNHKNews', async (req, res) => {
    try {
        // Get the kanji from the request parameters
        const kanji = req.query.randomKanji;

        // Call the function to get the NHK Easy News article
        const articleText = await getNhkArticle(kanji);

        // Return the NHK Easy News article text as JSON
        res.json({ article_text: articleText });
    } catch (e) {
        console.error(`An error occurred during NHK Easy News retrieval: ${e.message}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// app.get('/getNHKNews', async (req, res) => {
//     try {
//         // Assuming you have the current kanji available in req.query.current_kanji
//         const currentKanji = req.query.randomKanji;
//         console.log("HERHERHEHSHHERRHE"+ currentKanji)
//         // Make a GET request to the Flask server to get NHK news
//         const response = await axios.get(`https://pythonkanji.azurewebsites.net/getNHKNews?current_kanji=${currentKanji}`);

//         // Forward the NHK news data to the client
//         res.status(response.status).json(response.data);
//     } catch (error) {
//         console.error('Error fetching NHK news:', error);
//         res.status(500).json({ error: 'Internal Server Error' });
//     }
// });


// app.listen(port, () => {
//     console.log(`Server is running at http://localhost:${port}`);
// });