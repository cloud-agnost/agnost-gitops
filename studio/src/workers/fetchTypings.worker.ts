/// <reference lib="dom" />

import ts from 'typescript';

const ROOT_URL = `https://cdn.jsdelivr.net/`;

const loadedTypings: string[] = [];

function assertPath(path: string) {
	if (typeof path !== 'string') {
		throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
	}
}

function dirname(path: string): string {
	assertPath(path);
	if (path.length === 0) return '.';
	const code = path.charCodeAt(0);
	const hasRoot = code === 47; /*/*/
	let end = -1;
	let matchedSlash = true;
	for (let i = path.length - 1; i >= 1; --i) {
		const code = path.charCodeAt(i);
		if (code === 47 /*/*/) {
			if (!matchedSlash) {
				end = i;
				break;
			}
		} else {
			// We saw the first non-path separator
			matchedSlash = false;
		}
	}

	if (end === -1) return hasRoot ? '/' : '.';
	if (hasRoot && end === 1) return '//';
	return path.slice(0, end);
}

function join(...args: string[]): string {
	if (args.length === 0) return '.';
	let joined: string | undefined;
	for (let i = 0; i < args.length; ++i) {
		const arg = args[i];
		assertPath(arg);
		if (arg.length > 0) {
			if (joined === undefined) joined = arg;
			else joined += '/' + arg;
		}
	}
	if (joined === undefined) return '.';
	return normalize(joined);
}

function normalize(path: string): string {
	assertPath(path);

	if (path.length === 0) return '.';
	const isAbsolute = path.charCodeAt(0) === 47; /*/*/
	const trailingSeparator = path.charCodeAt(path.length - 1) === 47; /*/*/

	// Normalize the path
	path = normalizeStringPosix(path, !isAbsolute);

	if (path.length === 0 && !isAbsolute) path = '.';
	if (path.length > 0 && trailingSeparator) path += '/';

	if (isAbsolute) return '/' + path;
	return path;
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path: string, allowAboveRoot: boolean): string {
	let res = '';
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code: number | undefined;
	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) code = path.charCodeAt(i);
		else if (code === 47 /*/*/) break;
		else code = 47 /*/*/;
		if (code === 47 /*/*/) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (
					res.length < 2 ||
					lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== 46 /*.*/ ||
					res.charCodeAt(res.length - 2) !== 46 /*.*/
				) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf('/');
						if (lastSlashIndex !== res.length - 1) {
							if (lastSlashIndex === -1) {
								res = '';
								lastSegmentLength = 0;
							} else {
								res = res.slice(0, lastSlashIndex);
								lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
							}
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = '';
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) res += '/..';
					else res = '..';
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += '/' + path.slice(lastSlash + 1, i);
				else res = path.slice(lastSlash + 1, i);
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === 46 /*.*/ && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}
	return res;
}

/**
 * Send the typings library to the editor, the editor can then add them to the
 * registry
 * @param {string} virtualPath Path of typings
 * @param {string} typings Typings
 */
const addLib = (virtualPath: string, typings: string, fetchedPaths: Record<string, string>) => {
	fetchedPaths[virtualPath] = typings;
};

const fetchCache = new Map<string, Promise<string>>();

const doFetch = (url: string): Promise<string> => {
	const cached = fetchCache.get(url);
	if (cached) {
		return cached;
	}

	const promise = fetch(url)
		.then((response) => {
			if (response.status >= 200 && response.status < 300) {
				return Promise.resolve(response);
			}

			const error = new Error(response.statusText || response.status.toString());
			return Promise.reject(error);
		})
		.then((response) => response.text());

	fetchCache.set(url, promise);
	return promise;
};

const fetchFromDefinitelyTyped = async (
	dependency: string,
	fetchedPaths: Record<string, string>,
) => {
	try {
		const x = await doFetch(`${ROOT_URL}npm/@types/${dependency}@latest/package.json`);
		const x_1 = JSON.parse(x);
		await fetchAndAddDependencies({ [x_1.name]: x_1.version }, fetchedPaths);
	} catch {
		const typings = await doFetch(
			`${ROOT_URL}npm/@types/${dependency.replace('@', '').replace(/\//g, '__')}/index.d.ts`,
		);
		addLib(`node_modules/@types/${dependency}/index.d.ts`, typings, fetchedPaths);
	}
};

const getRequireStatements = (title: string, code: string): string[] => {
	const requires: string[] = [];

	const sourceFile = ts.createSourceFile(
		title,
		code,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS,
	);

	self.ts.forEachChild(sourceFile, (node) => {
		switch (node.kind) {
			case ts.SyntaxKind.ImportDeclaration: {
				const importDeclaration = node as ts.ImportDeclaration;
				const moduleSpecifier = importDeclaration.moduleSpecifier as ts.StringLiteral;
				requires.push(moduleSpecifier.text);
				break;
			}

			case ts.SyntaxKind.ExportDeclaration: {
				// For syntax 'export ... from '...'''

				const exportDeclaration = node as ts.ExportDeclaration;
				if (exportDeclaration.moduleSpecifier) {
					const moduleSpecifier = exportDeclaration.moduleSpecifier as ts.StringLiteral;
					requires.push(moduleSpecifier.text);
				}
				break;
			}
			default: {
				/* */
			}
		}
	});

	return requires;
};

const tempTransformFiles = (files: any[]): Record<string, any> => {
	const finalObj: Record<string, any> = {};

	files.forEach((d) => {
		finalObj[d.name] = d;
	});

	return finalObj;
};

const getFileMetaData = (dependency: string, version: string, depPath: string) =>
	doFetch(`https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`)
		.then((response) => JSON.parse(response))
		.then((response) => response.files.filter((f: any) => f.name.startsWith(depPath)))
		.then(tempTransformFiles);

const resolveAppropiateFile = (fileMetaData: Record<string, any>, relativePath: string): string => {
	const absolutePath = `/${relativePath}`;

	if (fileMetaData[`${absolutePath}.d.ts`]) return `${relativePath}.d.ts`;
	if (fileMetaData[`${absolutePath}.ts`]) return `${relativePath}.ts`;
	if (fileMetaData[absolutePath]) return relativePath;
	if (fileMetaData[`${absolutePath}/index.d.ts`]) return `${relativePath}/index.d.ts`;

	return relativePath;
};

const getFileTypes = async (
	depUrl: string,
	dependency: string,
	depPath: string,
	fetchedPaths: Record<string, string>,
	fileMetaData: Record<string, any>,
): Promise<any> => {
	const virtualPath = join('node_modules', dependency, depPath);

	if (fetchedPaths[virtualPath]) return Promise.resolve([]);

	const typings = await doFetch(`${depUrl}/${depPath}`);
	if (fetchedPaths[virtualPath]) return Promise.resolve([]);
	addLib(virtualPath, typings, fetchedPaths);
	return await Promise.all(
		getRequireStatements(depPath, typings)
			.filter(
				// Don't add global deps
				(dep) => dep.startsWith('.'),
			)
			.map((relativePath) => join(dirname(depPath), relativePath))
			.map((relativePath_1) => resolveAppropiateFile(fileMetaData, relativePath_1))
			.map((nextDepPath) =>
				getFileTypes(depUrl, dependency, nextDepPath, fetchedPaths, fileMetaData),
			),
	);
};

async function fetchFromMeta(
	dependency: string,
	version: string,
	fetchedPaths: Record<string, string>,
): Promise<void[]> {
	const depUrl = `https://data.jsdelivr.com/v1/package/npm/${dependency}@${version}/flat`;
	const response = await doFetch(depUrl);
	const meta = JSON.parse(response);
	const filterAndFlatten = (files_1: any[], filter: RegExp) =>
		files_1.reduce((paths: string[], file: any) => {
			if (filter.test(file.name)) {
				paths.push(file.name);
			}
			return paths;
		}, []);
	let dtsFiles = filterAndFlatten(meta.files, /\.d\.ts$/);
	if (dtsFiles.length === 0) {
		// if no .d.ts files found, fallback to .ts files
		dtsFiles = filterAndFlatten(meta.files, /\.ts$/);
	}
	if (dtsFiles.length === 0) {
		throw new Error('No inline typings found.');
	}
	return await Promise.all(
		dtsFiles.map((file_1) =>
			doFetch(`https://cdn.jsdelivr.net/npm/${dependency}@${version}${file_1}`).then((dtsFile) =>
				addLib(`node_modules/${dependency}${file_1}`, dtsFile, fetchedPaths),
			),
		),
	);
}

async function fetchFromTypings(
	dependency: string,
	version: string,
	fetchedPaths: Record<string, string>,
): Promise<any> {
	const depUrl = `${ROOT_URL}npm/${dependency}@${version}`;
	const response = await doFetch(`${depUrl}/package.json`);
	const packageJSON = JSON.parse(response);
	const types = packageJSON.typings || packageJSON.types;
	if (types) {
		// Add package.json, since this defines where all types lie
		addLib(`node_modules/${dependency}/package.json`, JSON.stringify(packageJSON), fetchedPaths);

		// get all files in the specified directory
		return getFileMetaData(dependency, version, join('/', dirname(types)))
			.then((fileData) =>
				Promise.all([
					getFileTypes(
						depUrl,
						dependency,
						resolveAppropiateFile(fileData, types),
						fetchedPaths,
						fileData,
					),
				]),
			)
			.then((result) => result[0]);
	}
	throw new Error('No typings field in package.json');
}

async function fetchAndAddDependencies(
	dependencies: Record<string, string>,
	fetchedPaths: Record<string, string>,
): Promise<void> {
	const depNames = Object.keys(dependencies);

	await Promise.all(
		depNames.map(async (dep) => {
			try {
				if (!loadedTypings.includes(dep)) {
					loadedTypings.push(dep);

					const depVersion = await doFetch(
						`https://data.jsdelivr.com/v1/package/resolve/npm/${dep}@${dependencies[dep]}`,
					)
						.then((x) => JSON.parse(x))
						.then((x) => x.version);

					// eslint-disable-next-line no-await-in-loop
					await fetchFromTypings(dep, depVersion, fetchedPaths).catch(() =>
						// not available in package.json, try checking meta for inline .d.ts files
						fetchFromMeta(dep, depVersion, fetchedPaths).catch(() =>
							// Not available in package.json or inline from meta, try checking in @types/
							fetchFromDefinitelyTyped(dep, fetchedPaths),
						),
					);
				}
			} catch (e) {
				// Don't show these cryptic messages to users, because this is not vital
				console.error(`Couldn't find typings for ${dep}`, e);
			}
		}),
	);
}

self.addEventListener('message', async (event) => {
	const dependencies: Record<string, string> = event.data;
	const fetchedPaths: Record<string, string> = {};
	await fetchAndAddDependencies(dependencies, fetchedPaths);
	self.postMessage(fetchedPaths);
});
