export const addComment = (j, node, comment) => {
	const commentBlock = j.block(` METAL_JSX_CODE_MOD: ${comment} `);

	commentBlock.trailing = true;

	node.comments = node.comments || [];
	node.comments.push(commentBlock);
};
