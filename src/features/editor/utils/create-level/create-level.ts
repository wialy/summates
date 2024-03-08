/* eslint-disable sonarjs/cognitive-complexity */
import { VECTOR_ZERO } from '../../../engine/constants';
import {
	Entity,
	Floor,
	isFloor,
	isMovable,
	Vector,
} from '../../../engine/types/entities';
import { getByPosition } from '../../../engine/utils/get-by-position';
import { getIsOppositeVector } from '../../../engine/utils/get-is-opposite-vector';
import { getIsSameVector } from '../../../engine/utils/get-is-same-vector';
import { getSumVector } from '../../../engine/utils/get-sum-vector';
import { MAX_GRID_HEIGHT, MAX_GRID_WIDTH } from '../../constants';
import { getRandom, setRandomSeed } from '../get-random';

const MAX_FLOOR_POSITION_ITERATIONS = 100;

export const createLevel = ({
	entities: availableEntities,
	seed,
}: {
	seed: number;
	entities: Array<Omit<Entity, 'position'>>;
}) => {
	setRandomSeed(seed);

	const result: Entity[] = [];

	const floors = availableEntities.filter(isFloor);

	const directors = floors.filter((entity) => entity.direction !== undefined);
	const targets = floors.filter((entity) => entity.target !== undefined);
	const otherFloors = floors
		.filter(
			(entity) => entity.direction === undefined && entity.target === undefined,
		)
		.sort(() => getRandom() - 0.5);

	const currentPosition: Vector = {
		x: Math.floor(MAX_GRID_WIDTH / 2),
		y: Math.floor(MAX_GRID_HEIGHT / 2),
	};

	let isBroken = false;

	while (otherFloors.length > 0) {
		const floor = otherFloors.pop();

		if (!floor) {
			break;
		}

		result.push({
			...floor,
			position: { ...currentPosition },
		} as Floor);

		let nextPosition: Vector = { x: 0, y: 0 };
		let floorPositionIterations = 0;

		do {
			nextPosition = { ...currentPosition };

			if (getRandom() > 0.5) {
				nextPosition.x += getRandom() > 0.5 ? 1 : -1;
			} else {
				nextPosition.y += getRandom() > 0.5 ? 1 : -1;
			}

			floorPositionIterations++;

			if (floorPositionIterations >= MAX_FLOOR_POSITION_ITERATIONS) {
				break;
			}
		} while (
			nextPosition.x < 0 ||
			nextPosition.x >= MAX_GRID_WIDTH ||
			nextPosition.y < 0 ||
			nextPosition.y >= MAX_GRID_HEIGHT ||
			getIsSameVector(nextPosition, currentPosition) ||
			result.some(
				(entity) =>
					getIsSameVector(entity.position, nextPosition) && entity.type === 'floor',
			)
		);

		currentPosition.x = nextPosition.x;
		currentPosition.y = nextPosition.y;

		if (floorPositionIterations >= MAX_FLOOR_POSITION_ITERATIONS) {
			isBroken = true;

			break;
		}
	}

	if (isBroken) {
		return;
	}

	while (targets.length > 0) {
		const target = targets.pop();

		if (!target) {
			continue;
		}

		const possibleTargetFloors = result
			.filter(
				(entity) =>
					isFloor(entity) &&
					entity.target === undefined &&
					entity.direction === undefined,
			)
			.sort(() => getRandom() - 0.5);

		if (possibleTargetFloors.length === 0) {
			continue;
		}

		const targetFloor =
			possibleTargetFloors[Math.floor(getRandom() * possibleTargetFloors.length)];

		if (!targetFloor) {
			continue;
		}

		(targetFloor as Floor).target = target.target;
	}

	while (directors.length > 0) {
		const director = directors.pop();

		if (!director) {
			continue;
		}

		const { direction } = director;

		if (!direction) {
			continue;
		}

		const cleanFloors = result
			.filter(
				(entity) =>
					isFloor(entity) &&
					entity.direction === undefined &&
					entity.target === undefined,
			)
			.sort(() => getRandom() - 0.5) as Floor[];

		while (cleanFloors.length > 0) {
			const floor = cleanFloors.pop();

			if (!floor) {
				continue;
			}

			if (getIsSameVector(direction, VECTOR_ZERO)) {
				floor.direction = direction;

				break;
			}

			const neighborsTowardsDirection = [];

			let positionIterator = floor.position;
			let nextFloor: Floor | undefined;

			do {
				positionIterator = getSumVector(positionIterator, direction);

				nextFloor = getByPosition({
					entities: result,
					filter: isFloor,
					position: positionIterator,
				});

				if (nextFloor) {
					neighborsTowardsDirection.push(nextFloor);
				}
			} while (nextFloor);

			// no neighbors towards direction
			if (neighborsTowardsDirection.length === 0) {
				continue;
			}

			// has opposite neighbor
			if (
				neighborsTowardsDirection.some(
					(someFloor) =>
						someFloor.direction &&
						getIsOppositeVector(someFloor.direction, direction),
				)
			) {
				continue;
			}

			floor.direction = direction;

			break;
		}
	}

	const floorPositions = result
		.filter(
			(entity) =>
				(entity as Floor).target === undefined &&
				(entity as Floor).direction === undefined,
		)
		.map((entity) => entity.position)
		.sort(() => getRandom() - 0.5);

	const movables = availableEntities
		.filter(isMovable)
		.sort(() => getRandom() - 0.5);

	for (const [movableIndex, movable] of movables.entries()) {
		const position: Vector = floorPositions[movableIndex];

		if (!position) {
			break;
		}

		result.push({
			...movable,
			position,
		});
	}

	return result;
};
