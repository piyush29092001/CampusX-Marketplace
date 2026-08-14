const express = require('express');
const router = express.Router();
const { analyzeProductListing } = require('../controllers/listingAIController');
// const { protect } = require('../middleware/auth'); // Optional if you strictly want to protect it

// POST /api/ai/analyze-listing
router.post('/analyze-listing', analyzeProductListing);

module.exports = router;
