// interactive.js
// 2024-03-29

// Handles interactions between html and 'netflix_but_good' database
//
// To initalize workspace, do 'npm init -y'
// To use Express, install it via 'npm install express'
// To use Cookie Parser, install it via 'npm install cookie-parser'
// To use MongoDB, install it via 'npm install mongodb'
// To use JSON Web Tokens, install it via 'npm install jsonwebtoken'
// To use .env files, install it via 'npm install dotenv'
// To use bcrypt, install it via 'npm install bcrypt'

const PORT = 8080; // Easier to change if need be

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require('path'); 
const app = express();
const fs = require('fs');

app.use(cookieParser());

const mongoose = require('mongoose'); 
mongoose.connect("mongodb://localhost:27017/netflix_but_good");

const jwt = require('jsonwebtoken');

require('dotenv').config()

app.use(express.static('public'));
app.use(express.json());
// Allows access to information (encoded url) from forms
app.use(express.urlencoded({ extended: true}));

// Generate a salt to hash the password
const saltRounds = 10;

const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
        dropDups: true
    },
    attempts: {
        type: Number,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    role: {
        type: String,
        require: true
    }
});

const movieSchema = new Schema({
    name: {
        type: String,
        require: true,
        unique: true,
        dropDups: true
    },
    link: {
        type: String,
        require: true
    },
    genre: {
        type: String,
        require: true
    },
    comment: {
        //type: String,
        type: Array,
        require: true
    },
    likes: {
        type: Number,
        require: true
    }
});

const movieCollection = new mongoose.model("movies", movieSchema)

const userCollection = new mongoose.model("user_data", userSchema)

// Checks if a given username meets requirements
// - at least 5 characters long
// - no special characters besides 1 underscore
// Will use regular expressions to check if username 
function usernameRequirements(str) {
    // Test for a letter at start and underscore at any point in string, else return false
    if (!(/^[a-zA-Z]{1,}.*_.*$/.test(str))) return false;

    // Test for special characteres (besides underscore), if found, return false
    if (/[!@#$%^&*()+{}\[\]:;<>,.?~\\/-]/.test(str)) return false;

    // Test if username at least 5 and at most 63 characters long
    if (str.length < 5 || str.length > 63) return false;

    // Username is good
    return true;
}

// Checks if a given password meets requirements
// - at least 8 characters long
// - at least 1 special character
// - at least 1 upper case letter
// - at least 1 lower case letter
// - at least 1 number
function passwordRequirements(str) {
    // Check if the password is at least 8 characters long and at most 63 characters long
    if (str.length < 8 || str.length > 63) return false;

    // Check if the password contains at least one uppercase letter
    if (!/[A-Z]/.test(str)) return false;

    // Check if the password contains at least one lowercase letter
    if (!/[a-z]/.test(str)) return false;

    // Check if the password contains at least one number
    if (!/\d/.test(str)) return false;

    // Check if password contains special characters, if so, return false
    if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(str)) return false;

    // Password is good
    return true;
}

async function isUsernameTaken(username) {
    try {
      // Count documents that have the provided username
      const user = await userCollection.findOne({ name: username }).exec();
      
      // If not found, return true
      return user !== null;
    } 
    catch (error) {
        console.error('Error checking username:', error);
        return false; // Return false if an error occurs
    }
}

// Function to delete a user by name
async function deleteUser(username) {
    try {
        // Find the user by name
        const user = await userCollection.findOne({ name: username });

        if (!user) {
            console.log('User not found');
            return;
        }

        // Remove the user
        await userCollection.deleteOne({ name: username }); 

        console.log('User deleted successfully');
    } 
    catch (error) {
        console.error('Error deleting user:', error);
    }
}

async function extractFieldByName(name, fieldName) {
    try {
        const user = await userCollection.findOne({ name }); // Find the user by name
        if (user) {
            return user[fieldName]; // Return the specified field value
        } 
        else {
            console.error('User not found');
        }
    } 
    catch (error) {
        console.error('Error extracting field:', error);
        return null; // Return null if an error occurs
    }
}

async function isMovieNameTaken(title) {
    try {
      // Count documents that have the provided username
      const movie = await movieCollection.findOne({ name: title }).exec();
      
      // If not found, return true
      return movie !== null;
    } 
    catch (error) {
        console.error('Error checking username:', error);
        return false; // Return false if an error occurs
    }
}

async function isLinkTaken(thelink) {
    try {
      // Count documents that have the provided username
      const movie = await movieCollection.findOne({ link: thelink }).exec();
      
      // If not found, return true
      return movie !== null;
    } 
    catch (error) {
        console.error('Error checking username:', error);
        return false; // Return false if an error occurs
    }
}

async function deleteMovie(title) {
    try {
        // Find the user by name
        const movie = await movieCollection.findOne({ name: title });

        if (!movie) {
            console.log('Movie not found');
            return;
        }

        // Remove the user
        await movieCollection.deleteOne({ name: title }); 

        console.log('Movie deleted successfully');
    } 
    catch (error) {
        console.error('Error deleting user:', error);
    }
}

// Served as default as this '.get' comes first, basically the root
app.get('/', (req, res) => {
	res.redirect('login.html');
});

app.get('/getErrorMessage', (req, res) => {
    // Retrieve the error message from wherever it's stored
    const errorMessage = 'Sample error message'; // Replace this with your actual error message

    // Send the error message as the response
    res.send(errorMessage);
});

// Essentially 'serving' the HTML form
app.get('/login.html', (req, res) => {
	res.sendFile(path.join(__dirname, 'pages', '/login.html'));
});

app.get('/welcome.html', authenticateToken, (req, res) => {
    const role = req.user.role;
    if (role == 'viewer') res.redirect('/viewerhome.html');
    else if (role == 'contenteditor') res.redirect('/editorhome.html');
    else if (role == 'marketmanager') res.redirect('/managerhome.html');
    //res.sendFile(path.join(__dirname, 'public', '/welcome.html'));
});

app.get('/viewerhome.html', authenticateToken, (req, res) => {
    const role = req.user.role;
    if (role != 'viewer')
    {
        if (role == 'contenteditor') return res.redirect("/editorhome.html");
        else if (role == 'marketmanager') return res.redirect("/managerhome.html");
    }
    res.sendFile(path.join(__dirname, 'pages', '/viewerhome.html'));
});

app.get('/movieviewer.html', authenticateToken, (req, res) => {
    const role = req.user.role;
    if (role != 'viewer')
    {
        if (role == 'contenteditor') return res.redirect("/editorhome.html");
        else if (role == 'marketmanager') return res.redirect("/managerhome.html");
    }
    res.sendFile(path.join(__dirname, 'pages', '/movieviewer.html'));
});

app.get('/editorhome.html', authenticateToken, (req, res) => {
    const role = req.user.role;
    if (role != 'contenteditor')
    {
        if (role == 'viewer') return res.redirect("/viewerhome.html");
        else if (role == 'marketmanager') return res.redirect("/managerhome.html");
    }
    res.sendFile(path.join(__dirname, 'pages', '/editorhome.html'));
});

app.get('/managerhome.html', authenticateToken, (req, res) => {
    const role = req.user.role;
    if (role != 'marketmanager')
    {
        if (role == 'viewer') return res.redirect("/viewerhome.html");
        else if (role == 'contenteditor') return res.redirect("/editorhome.html");
    }
    res.sendFile(path.join(__dirname, 'pages', '/managerhome.html'));
});

app.get('/editorfeedback.html', authenticateToken, (req, res) => {
    const role = req.user.role;
    if (role != 'contenteditor')
    {
        if (role == 'viewer') return res.redirect("/viewerhome.html");
        else if (role == 'marketmanager') return res.redirect("/managerhome.html");
    }
    res.sendFile(path.join(__dirname, 'pages', '/editorfeedback.html'));
});

/*
app.get('/PLACEHOLDER', authenticateToken, (req, res) => {
    const username = req.user.username; // For user data extraction
    const role = req.user.role;
    res.sendFile(path.join(__dirname, 'public', '/PLACEHOLDER.html'));
});
*/

app.get('/movies.json', (req, res) => {
    const moviesFilePath = path.join(__dirname, 'netflix_but_good', 'movies.json');
    res.sendFile(moviesFilePath);
});

// Recieving data from forms, posts to 'interactive.js'
app.post('/interactive.js', async (req, res) => {
    const { username, password, action } = req.body;

    // SIGN UP REQUEST
    if (action === 'sign up') {
        console.log('Sign up Request:');
        console.log('Username:', username);
        console.log('Password:', password);

        nameExists = await isUsernameTaken(username);

        // USER EXISTS
        if (nameExists)
        {
            console.log('User already exists');
            res.redirect('/login.html?error=⚠️User%20already%20exists%20⚠️');
        }
        // USER DOESN'T EXIST
        else
        {
            // Checks if username meets requiremetns, if so, create user
            if (usernameRequirements(username) && passwordRequirements(password)) {
                bcrypt.hash(password, saltRounds, (err, hash) => {
                    const newuser = new userCollection({ 
                        name: username, 
                        attempts: 0, 
                        password: hash, 
                        role: "viewer"
                    })
                    newuser.save() 
                });

                console.log('User successfully created');

                const userTokenInfo = { username , role : "viewer" };
                const token = jwt.sign(userTokenInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
        
                res.cookie("token", token, {
                    //httpOnly: true,
                });
                // Redirect to the welcome.html page after successful sign-up
                res.redirect('/welcome.html');
            }
            // If user doesn't meet both username and password requirements signal error
            else if(!usernameRequirements(username) && !passwordRequirements(password)) {
                console.log('Bad username and password detected');
                res.redirect('/login.html?error=⚠️Bad%20username%20and%20password%20detected⚠️');
            }
            // If user doesn't meet username requirements signal error
            else if(!usernameRequirements(username)) {
                console.log('Bad username detected');
                res.redirect('/login.html?error=⚠️Bad%20username%20detected⚠️');
            }
            // If user doesn't meet password requirements signal error
            else if(!passwordRequirements(password)) {
                console.log('Bad password detected');
                res.redirect('/login.html?error=⚠️Bad%20password%20detected⚠️');
            }
            // Backup error if the user somehow bypasses all other errors
            else {
                console.log('Bad username and/or password detected');
                res.redirect('/login.html?error=⚠️Bad%20username/password%20detected⚠️');
            }
    }
    // LOG IN REQUEST
    } 
    else if (action === 'log in') {
        console.log('Log in Request:');
        console.log('Username:', username);
        console.log('Password:', password);

        const nameExists = await isUsernameTaken(username);

        if (!nameExists) {
            console.log('Invalid username');
            res.redirect('/login.html?error=⚠️Invalid%20username⚠️');
        } 
        else {
            const currentPassword = await extractFieldByName(username, 'password');
            const currentRole = await extractFieldByName(username, 'role');
            
            const result = await bcrypt.compare(password, currentPassword);

            if (!result) {
                await userCollection.findOneAndUpdate(
                    { name: username },
                    { $inc: { attempts: 1 } },
                    { new: true }
                );
    
                //const user = await userCollection.findOne({ username });
                const currentAttempts = await extractFieldByName(username, 'attempts');
                console.log('Attempts:', currentAttempts)
                if (currentAttempts >= 5) {
                    await deleteUser(username);
                    console.log(username, ' deleted due to 5 or more login attempts');
                    return res.redirect('/login.html?error=⚠️Account%20deleted%20due%20to%205%20or%20more%20login%20attempts⚠️');
                }
    
                console.log('Invalid password');
                return res.redirect(`/login.html?error=⚠️Invalid%20password.%20Failed%20Attempts:%20${currentAttempts}⚠️`);
            }
            console.log('User successfully logged in');

            const userTokenInfo = { username: username, role: currentRole };
            const token = jwt.sign(userTokenInfo, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

            res.cookie('token', token, {
                //httpOnly: true,
            });

            // Redirect to the welcome.html page after successful login
            return res.redirect('/welcome.html');
        }
    }
});

// Endpoint to handle adding a movie
app.post('/addMovie', async (req, res) => {
    const { movieName, youtubeLink, genre } = req.body;

    const isDuplicateName = await isMovieNameTaken(movieName);
    const isDuplicateLink = await isLinkTaken(youtubeLink);

    if (isDuplicateName && isDuplicateLink) {
        console.log('Duplicate movie name and link detected');
        res.redirect('/editorhome.html?error=Duplicate%20movie%20name%20and%20link%20detected');
    } 
    else if (isDuplicateName) {
        console.log('Duplicate movie name detected');
        res.redirect('/editorhome.html?error=Duplicate%20movie%20name%20detected');
    } 
    else if (isDuplicateLink) {
        console.log('Duplicate YouTube link detected');
        res.redirect('/editorhome.html?error=Duplicate%20YouTube%20link%20detected');
    } 
    else {

        const newMovie = new movieCollection({ 
            name: movieName, 
            link: youtubeLink, 
            genre: genre,
            comment: '',
            likes: 0
        })

        newMovie.save();
        console.log('Movie added:', movieName);
        res.redirect('/editorhome.html?error=Movie%20added%20successfully');
    }
});

// Endpoint to handle removing a movie
app.post('/removeMovie', async (req, res) => {
    const movieNameToRemove = req.body.movieNameToRemove;

    const movieExists = await isMovieNameTaken(movieNameToRemove);

    if (!movieExists) {
        console.log('Movie not found');
        res.redirect('/editorhome.html?error=Movie%20not%20found');
    } 
    else 
    {
        await deleteMovie(movieNameToRemove);
        console.log(movieNameToRemove, ' has been removed');
        res.redirect('/editorhome.html?error=Movie%20removed%20successfully');
    }
});

// Endpoint to handle liking a movie
app.post('/likeMovie', async (req, res) => {
    const movieName = req.body.movieName;

    const movieExists = isMovieNameTaken(movieName);

    if (!movieExists) {
        console.log('Movie not found');
        res.status(404).send('Movie not found');
        return;
    }

    // Increment the likes counter
    await movieCollection.findOneAndUpdate(
        { name: movieName },
        { $inc: { likes: 1 } },
        { new: true }
    );
    console.log('Movie liked:', movieName);
    res.status(200).send('Movie liked successfully');
});

// Add a new endpoint to retrieve all movies from the MongoDB collection
app.get('/allMovies', async (req, res) => {
    try {
        // Find all movies in the collection
        const allMovies = await movieCollection.find();

        // Send the array of movie data as the response
        res.json(allMovies);
    } 
    catch (error) {
        console.error('Error fetching all movie data:', error);
        res.status(500).send('Internal server error');
    }
});

// Add a new endpoint to retrieve only movie names and genres from the MongoDB collection
app.get('/movieNamesAndGenres', async (req, res) => {
    try {
        // Find all movies in the collection, but only project the name and genre fields
        const movies = await movieCollection.find({}, { name: 1, genre: 1, _id: 0 });

        // Send the array of movie data as the response
        res.json(movies);
    } 
    catch (error) {
        console.error('Error fetching movie data:', error);
        res.status(500).send('Internal server error');
    }
});

// Add a new endpoint to retrieve movie names, likes, and comments from the MongoDB collection
app.get('/movieNameLikesComment', async (req, res) => {
    try {
        // Find all movies in the collection and project the name, likes, and comment fields
        const movies = await movieCollection.find({}, { name: 1, likes: 1, comment: 1, _id: 0 });

        // Send the array of movie data as the response
        res.json(movies);
    } 
    catch (error) {
        console.error('Error fetching movie data:', error);
        res.status(500).send('Internal server error');
    }
});

// Add a new endpoint to retrieve movie names, genres, comments, and links from the MongoDB collection
app.get('/getMovieNameGenreCommentLink', async (req, res) => {
    try {
        // Find all movies in the collection and project the name, genre, comment, and link fields
        const movies = await movieCollection.find({}, { name: 1, genre: 1, comment: 1, link: 1, _id: 0 });

        // Send the array of movie data as the response
        res.json(movies);
    } 
    catch (error) {
        console.error('Error fetching movie data:', error);
        res.status(500).send('Internal server error');
    }
});


// Add a new endpoint to retrieve movie by name from the MongoDB collection
app.get('/getMovieByName', async (req, res) => {
    const movieName = req.query.name;

    try {
        // Find the movie by name in the collection
        const movie = await movieCollection.findOne({ name: movieName });

        if (movie) {
            // Send the movie data as the response
            res.json(movie);
        } 
        else {
            console.error('Movie not found');
            res.status(404).send('Movie not found');
        }
    } 
    catch (error) {
        console.error('Error fetching movie data:', error);
        res.status(500).send('Internal server error');
    }
});

// Endpoint to handle updating movie comment
app.post('/updateMovieComment', async (req, res) => {
    const { movieName, comment } = req.body;

    try {
        // Check if the movie exists in the collection
        const existingMovie = await movieCollection.findOne({ name: movieName });

        if (!existingMovie) {
            // If the movie doesn't exist, return an error
            console.log('Movie does not exist:', movieName);
            return res.redirect('/managerhome.html?error=Movie%20does%20not%20exist');
        }

        // Update the comment field of the existing movie
        await movieCollection.findOneAndUpdate(
            { name: movieName },
            { $push: { comment: comment } },
            { new: true }
        );

        console.log('Movie comment updated:', movieName);
        res.redirect('/managerhome.html?error=Movie%20comment%20updated%20successfully');
    } 
    catch (error) {
        console.error('Error updating movie comment:', error);
        res.redirect('/managerhome.html?error=Error%20updating%20movie%20comment');
    }
});

function authenticateToken(req, res, next)
{
    const token = req.cookies.token;

    if (!token) {
        res.redirect("/");
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.redirect("/");
        }
        req.user = decoded; // Save decoded token payload to request object for further use
        next();
    });
}

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
