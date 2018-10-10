/**
 * A transform that converts anchor elements to router Link
 *
 * It should convert this:
 *
 *   <a href="test">foo</a>
 *
 * To this:
 *
 *   <Link to="test">foo</Link>
 *
 */

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	const addedLink = false;

	root.find(j.JSXElement, {openingElement: {name: {name: 'a'}}}).forEach(
		path => {
			addedLink = true;

			const {closingElement, openingElement} = path.node;

			j(path)
				.find(j.JSXAttribute, {name: {name: 'href'}})
				.forEach(({node}) => (node.name.name = 'to'));

			openingElement.name.name = 'Link';

			if (!openingElement.selfClosing) {
				closingElement.name.name = 'Link';
			}
		}
	);

	if (addedLink) {
		root.find(j.Program)
			.nodes()[0]
			.body.unshift(
				j.importDeclaration(
					[j.importSpecifier(j.identifier('Link'))],
					j.literal('@reach/router')
				)
			);
	}

	return root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto',
		reuseWhitespace: false
	});
};
