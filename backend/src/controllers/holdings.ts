import express from 'express';
import { Prisma } from '@prisma/client';
import authMiddleware from '../middleware/auth.js';
import validateHoldingInput from '../middleware/validation.js';
import {
	createHolding,
	deleteHolding,
	getHoldingById,
	getUserHoldings,
	updateHolding,
} from '../services/holdings.js';

const router = express.Router();

function isP2002(error: unknown): error is Prisma.PrismaClientKnownRequestError {
	return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

router.use(authMiddleware);

router.get('/holdings', async (req, res) => {
	const userId = req.user?.sub;
	if (!userId) {
		return res.status(401).json({ msg: 'Unauthorized' });
	}

	const holdings = await getUserHoldings(userId);
	return res.status(200).json(holdings);
});

router.get('/holdings/:id', async (req, res) => {
	const userId = req.user?.sub;
	if (!userId) {
		return res.status(401).json({ msg: 'Unauthorized' });
	}

	const holding = await getHoldingById(req.params.id, userId);
	if (!holding) {
		return res.status(404).json({ msg: 'Holding not found' });
	}

	return res.status(200).json(holding);
});

router.post('/holdings', async (req, res) => {
	const userId = req.user?.sub;
	if (!userId) {
		return res.status(401).json({ msg: 'Unauthorized' });
	}

	const symbol = req.body.symbol;
	const units = Number(req.body.units);
	const validation = validateHoldingInput(symbol, units);
	if (!validation.valid) {
		return res.status(400).json({ msg: 'Invalid holding input', errors: validation.errors });
	}

	try {
		const holding = await createHolding(userId, String(symbol).trim().toUpperCase(), units);
		return res.status(201).json(holding);
	} catch (error) {
		if (isP2002(error) || (error instanceof Error && (error as any).statusCode === 409)) {
			return res.status(409).json({ msg: 'You already have a holding for this symbol.' });
		}
		return res.status(500).json({ msg: 'Internal server error' });
	}
});

router.patch('/holdings/:id', async (req, res) => {
	const userId = req.user?.sub;
	if (!userId) {
		return res.status(401).json({ msg: 'Unauthorized' });
	}

	const symbol = req.body.symbol;
	const units = Number(req.body.units);
	const validation = validateHoldingInput(symbol, units);
	if (!validation.valid) {
		return res.status(400).json({ msg: 'Invalid holding input', errors: validation.errors });
	}

	try {
		const holding = await updateHolding(req.params.id, userId, {
			symbol: String(symbol).trim().toUpperCase(),
			units,
		});

		if (!holding) {
			return res.status(404).json({ msg: 'Holding not found' });
		}

		return res.status(200).json(holding);
	} catch (error) {
		if (isP2002(error) || (error instanceof Error && (error as any).statusCode === 409)) {
			return res.status(409).json({ msg: 'You already have a holding for this symbol.' });
		}
		if (error instanceof Error && (error as any).statusCode === 404) {
			return res.status(404).json({ msg: 'Holding not found' });
		}
		return res.status(500).json({ msg: 'Internal server error' });
	}
});

router.delete('/holdings/:id', async (req, res) => {
	const userId = req.user?.sub;
	if (!userId) {
		return res.status(401).json({ msg: 'Unauthorized' });
	}

	try {
		await deleteHolding(req.params.id, userId);
		return res.sendStatus(204);
	} catch (error) {
		if (error instanceof Error && (error as any).statusCode === 404) {
			return res.status(404).json({ msg: 'Holding not found' });
		}
		return res.status(500).json({ msg: 'Internal server error' });
	}
});

export { router };
