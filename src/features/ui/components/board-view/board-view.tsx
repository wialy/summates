import { Board } from '../../../engine/types/board';
import { isFloor, isMovable } from '../../../engine/types/entities';
import { TILE_SIZE } from '../../constants';
import { EntityView } from '../entity-view';

export const BoardView = ({ board }: { board: Board }) => {
	const { entities } = board;

	let width = 0;
	let height = 0;

	for (const entity of entities) {
		width = Math.max(width, entity.position.x + 1);
		height = Math.max(height, entity.position.y + 1);
	}

	const floors = entities.filter(isFloor);
	const persisted = entities
		.filter(isMovable)
		.sort((a, b) => (a.id > b.id ? 1 : -1));

	const list = [...floors, ...persisted];

	return (
		<div
			style={{
				left: '50%',
				position: 'absolute',
				top: '50%',
				transform: `translate(${(-width * TILE_SIZE) / 2}px, ${
					(-height * TILE_SIZE) / 2
				}px)`,
			}}
		>
			{list.map((entity) => (
				<EntityView
					key={entity.id}
					entity={entity}
				/>
			))}
		</div>
	);
};
