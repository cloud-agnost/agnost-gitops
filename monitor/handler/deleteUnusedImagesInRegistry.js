import axios from "axios";
import config from "config";
import { getDBClient } from "../init/db.js";
import helper from "../util/helper.js";

const registryBaseUrl = `http://registry.${process.env.NAMESPACE}.svc.cluster.local:5000/v2`;

export async function deleteUnusedImagesInRegistry() {
	try {
		const registryInfo = [];
		const repositories = await getImageRepositories();
		for (const repo of repositories) {
			const tags = await getRepositoryTags(repo);
			registryInfo.push({ repo, tags });
		}

		// Delete unused images (we keep the latest 5 images)
		for (const info of registryInfo) {
			const trimmedRepo = info.repo.replace(/-cache$/, "");
			const container = await getContainer(trimmedRepo);
			// If we do not have the container then we delete all tags
			const tagsToKeep = container
				? info.tags.slice(0, config.get("general.registry.maxImages"))
				: [];

			const tagsToDelete = container
				? info.tags.slice(config.get("general.registry.maxImages"))
				: info.tags;

			for (const tag of tagsToDelete) {
				try {
					await axios.delete(
						`${registryBaseUrl}/${info.repo}/manifests/${tag.dockerContentDigest}`,
						{
							headers: {
								Accept: "application/vnd.docker.distribution.manifest.v1+json",
							},
						}
					);
					console.log(`Deleted image manifest ${info.repo}:${tag.tag}`);
				} catch (err) {}
			}

			// If we have the container then we update the latest images only for actual repos not cached ones
			if (tagsToKeep.length > 0 && trimmedRepo === info.repo) {
				// Make api call to the platform to set the latest images of the container
				axios
					.post(
						helper.getPlatformUrl() + "/v1/telemetry/container/images",
						{ slug: trimmedRepo, images: tagsToKeep },
						{
							headers: {
								Authorization: process.env.MASTER_TOKEN,
								"Content-Type": "application/json",
							},
						}
					)
					.catch((err) => {
						console.error(
							`Cannot update container latest image data . ${
								err.response?.body?.message ?? err.message
							}`
						);
					});
			}
		}
	} catch (err) {
		console.error(`Cannot delete unused images in registry. ${err}`);
	}
}

/**
 * Retrieves the list of image repositories from the registry.
 * @returns {Promise<Array<string>>} The list of image repositories.
 */
async function getImageRepositories() {
	// Renew the access and refresh tokens
	const response = await axios.get(`${registryBaseUrl}/_catalog`);
	return response.data.repositories ?? [];
}

/**
 * Retrieves the tags and manifests for a given repository.
 *
 * @param {string} repo - The name of the repository.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects containing the tags and manifests.
 */
async function getRepositoryTags(repo) {
	const list = [];
	const response = await axios.get(`${registryBaseUrl}/${repo}/tags/list`);
	const tags = response.data.tags ?? [];
	for (const tag of tags) {
		const manifest = await getTagManifest(repo, tag);
		list.push({ tag, ...manifest });
	}

	return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Retrieves the tag manifest and digest information for a given repository and tag.
 *
 * @param {string} repo - The name of the repository.
 * @param {string} tag - The tag of the image.
 * @returns {Promise<Object>} The tag manifest object containing createdAt and dockerContentDigest properties.
 */
async function getTagManifest(repo, tag) {
	const manifest = await axios.get(
		`${registryBaseUrl}/${repo}/manifests/${tag}`,
		{
			headers: {
				Accept: "application/vnd.docker.distribution.manifest.v2+json",
			},
		}
	);

	const blob = await axios.get(
		`${registryBaseUrl}/${repo}/blobs/${manifest.data.config.digest}`,
		{
			headers: {
				Accept: "application/vnd.docker.distribution.manifest.v2+json",
			},
		}
	);

	return {
		createdAt: blob.data.created,
		dockerContentDigest: manifest.headers["docker-content-digest"],
	};
}

async function getContainer(slug) {
	let dbClient = getDBClient();

	return await dbClient
		.db("agnost")
		.collection("containers")
		.findOne({ slug: slug });
}
