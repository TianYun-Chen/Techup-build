// Needed for dotenv
require("dotenv").config();

// Needed for Express
var express = require('express')
var app = express()

// Needed for EJS
app.set('view engine', 'ejs');

// Needed for public directory
app.use(express.static(__dirname + '/public'));

// Needed for parsing form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Needed for Prisma to connect to database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

const targetAreaOptions = {
  '': 'All',
  "full-body": "Full Body",
  "stretch": "Stretch",
};

const durationOptions = {
  '': 'All',
  'below20': 'Below 20 mins',
  '20to40': '20 to 40 mins',
  '40to60': '40 to 60 mins',
  'above60min': 'More than 60 mins'
}

const getDurationSelect = (key) => {
  if (!key) {
    return null;
  }

  switch (key) {
    case 'below20':
      return { lte: 20 };
    case '20to40':
      return { gte: 20, lte: 40 };
    case '40to60':
      return { gte: 40, lte: 60 };
    case 'above60min':
      return { gte: 60 };
    default:
      return null;
  }
}

const levelOptions = {
  '': 'All',
  "1": "Beginner Level 1",
  "2": "Beginner Level 2",
  "3": "Intermediate",
}


var options = {
  'targetArea': targetAreaOptions,
  'duration': durationOptions,
  'level': levelOptions,
}

// Main landing page
app.get('/', async function (req, res) {

  console.log('search query', req.query);
  const params =  {
    level: req.query.level ?? '',
    duration: req.query.duration ?? '',
    targetArea: req.query.targetArea ?? '',
  };

  // Try-Catch for any errors
  try {
    const { level, duration: durationRaw, targetArea } = req.query;

    const where = {}
    if (level !== '') {
      where['level'] = level;
    }
    const duration = getDurationSelect(durationRaw);
    if (duration) {
      where['duration'] = duration;
    }
    if (targetArea !== '') {
      where['targetArea'] = targetArea;
    }
    // Get all blog posts
    const blogs = await prisma.post.findMany({
      where,
      orderBy: [
        {
          id: 'desc'
        }
      ]
      distinct: ['url'] // This ensures that only unique URLs are returned
});
    });

    // Render the homepage with all the blog posts
    await res.render('pages/home', {
      blogs,
      options,
      params: params,
    });
  } catch (error) {
    res.render('pages/home', { blogs: [], options, params });
    console.log(error);
  }
});

// About page
app.get('/about', function (req, res) {
  res.render('pages/about');
});

// New post page
app.get('/new', function (req, res) {
  res.render('pages/new', {
    options,
  });
});

// Create a new post
app.post('/new', async function (req, res) {

  // Try-Catch for any errors
  try {
    // Get the title and content from submitted form
    const { title, content, url, level, duration, targetArea } = req.body;
    console.log("body", req.body);

    // Reload page if empty title or content
    if (!title || !content) {
      console.log("Unable to create new post, no title or content");
      res.render('pages/new');
    } else {
      // Create post and store in database
      const blog = await prisma.post.create({
        data: {
          title,
          content,
          url,
          level,
          duration: parseInt(duration),
          targetArea,
        },
      });

      // Redirect back to the homepage
      res.redirect('/');
    }
  } catch (error) {
    console.log(error);
    res.render('pages/new', {
      options,
    });
  }

});

// Delete a post by id
app.post("/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.post.delete({
      where: { id: parseInt(id) },
    });

    // Redirect back to the homepage
    res.redirect('/');
  } catch (error) {
    console.log(error);
    res.redirect('/');
  }
});

// Tells the app which port to run on
app.listen(8080);