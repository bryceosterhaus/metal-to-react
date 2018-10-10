/**
 *
 * It should convert this:
 *
 *    class extends Component {
 *       created() {}
 *
 *       detached() {}
 *    }
 *
 * To this:
 *
 *    class extends Component {
 *       constructor(props) {
 *          super(props);
 *       }
 *
 *       FIXME_detached() {}
 *    }
 *
 */

import {addComment} from './utils/addComment';
import {NEW_LINE_STRING, regexReplaceNewLine} from './utils/newline';

const NAME_MAP = {
	attached: 'componentDidMount',
	created: 'constructor',
	detached: true,
	disposed: true,
	prepareStateForRender: 'getDerivedStateFromProps',
	rendered: 'componentDidUpdate',
	shouldUpdate: 'shouldComponentUpdate',
	willAttach: true,
	willDetach: 'componentWillUnmount',
	willReceiveProps: true,
	willReceiveState: true,
	willUpdate: true
};

module.exports = (file, api) => {
	const j = api.jscodeshift;
	const root = j(file.source);
	const addedCounts = new Map();

	root.find(j.MethodDefinition).forEach(path => {
		const {node} = path;
		const name = node.key.name;

		if (NAME_MAP.hasOwnProperty(name)) {
			node.key.name =
				NAME_MAP[name] === true ? 'FIXME_' + name : NAME_MAP[name];

			if (NAME_MAP[name] === 'constructor') {
				node.value.params.push(j.identifier('props'));

				const superExpression = j.expressionStatement(
					j.callExpression(j.identifier('super'), [
						j.identifier('props')
					])
				);

				node.value.body.body.unshift(NEW_LINE_STRING);

				node.value.body.body.unshift(superExpression);

				j(path)
					.find(j.MemberExpression, {
						property: {name: 'setState'}
					})
					.forEach(path =>
						addComment(
							j,
							path.node,
							'`setState` not allowed in constructor'
						)
					);
			}
		}
	});

	const source = root.toSource({
		objectCurlySpacing: false,
		useTabs: true,
		quote: 'auto'
	});

	return regexReplaceNewLine(source);
};
