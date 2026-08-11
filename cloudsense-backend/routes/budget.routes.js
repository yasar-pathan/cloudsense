const express = require('express');
const budgetController = require('../controllers/budget.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/', asyncHandler(budgetController.getBudgets));

router.post(
  '/',
  budgetController.createBudgetValidation,
  asyncHandler(budgetController.createBudget)
);

router.get('/status', asyncHandler(budgetController.getBudgetStatus));

router.put('/:id', asyncHandler(budgetController.updateBudget));

router.delete('/:id', asyncHandler(budgetController.deleteBudget));

module.exports = router;
