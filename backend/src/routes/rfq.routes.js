const express = require("express");
const rfqController = require("../controllers/rfq.controller");
const { validateCreateRFQ } = require("../middleware/validate");

const router = express.Router();

router.post("/", validateCreateRFQ, rfqController.createRFQ);
router.get("/", rfqController.listRFQs);
router.get("/:id", rfqController.getRFQById);

module.exports = router;
