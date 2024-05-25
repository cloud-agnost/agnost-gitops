import mongoose from "mongoose";
import { setKey, getKey, deleteKey } from "../init/cache.js";

/**
 * Each controller is a child of the base controller. When creating the base controller a mongoose schema model
 * is specified as the model.
 */
export default class BaseController {
	constructor(model) {
		this.model = model;
	}

	/**
	 * Starts a new databse transaction session and returns the session object
	 */
	async startSession() {
		// Check to see if transactions are supported by MongoDB deployment
		const db = mongoose.connection.db;
		const adminDb = db.admin();
		const serverStatus = await adminDb.serverStatus();

		// If transactions not supported then return
		if (!serverStatus.transactions) return;

		const session = await mongoose.startSession();
		session.startTransaction();

		return session;
	}

	/**
	 * Commits the transaction
	 * @param  {Object} session The database session object creates calling the startSession method
	 */
	async commit(session) {
		if (session) {
			await session.commitTransaction();
			session.endSession();
		}
	}

	/**
	 * Cancels (rollbacks) the transaction
	 * @param  {Object} session The database session object creates calling the startSession method
	 */
	async rollback(session) {
		if (session) {
			if (session.inTransaction()) await session.abortTransaction();
			session.endSession();
		}
	}

	/**
	 * Ends the session
	 * @param  {Object} session The database session object creates calling the startSession method
	 */
	async endSession(session) {
		if (session) session.endSession();
	}

	/**
	 * Runs the specified aggregation pipeline
	 * @param  {Object} pipeline Array of aggregation pipeline staages
	 */
	async aggregate(pipeline) {
		return await this.model.aggregate(pipeline);
	}

	/**
	 * Gets first object data matching the query from the database
	 * @param  {Object} query The database filter query
	 * @param  {Object} session The database session object
	 * @param  {string} projection The additonal hidden fields to return
	 * @param  {string} cacheKey Checks the cache with the give key and if found returns value from the cache
	 */
	async getOneByQuery(
		query,
		{ session = null, projection = null, cacheKey, lookup, lookup2 } = {}
	) {
		// See if we have a value for the key in redis
		if (cacheKey) {
			const value = await getKey(cacheKey);
			if (value) return value;
		}

		let result = await this.model
			.findOne(query, projection, { session })
			.populate(
				lookup
					? typeof lookup === "object"
						? lookup
						: { path: lookup }
					: undefined
			)
			.populate(
				lookup2
					? typeof lookup2 === "object"
						? lookup2
						: { path: lookup2 }
					: undefined
			)
			.lean();

		// Cache object if needed
		if (cacheKey && result) {
			setKey(cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Finds a single document by its _id field
	 * @param  {string} id The object identifer
	 * @param  {Object} session The database session object
	 * @param  {string} projection The additonal hidden fields to return
	 * @param  {string} cacheKey Checks the cache with the give key and if found returns value from the cache
	 */
	async getOneById(
		id,
		{ session = null, projection = null, cacheKey, lookup, lookup2 } = {}
	) {
		// See if we have a value for the key in redis
		if (cacheKey) {
			const value = await getKey(cacheKey);
			if (value) return value;
		}

		let result = await this.model
			.findById(id, projection, { session })
			.populate(
				lookup
					? typeof lookup === "object"
						? lookup
						: { path: lookup }
					: undefined
			)
			.populate(
				lookup2
					? typeof lookup2 === "object"
						? lookup2
						: { path: lookup2 }
					: undefined
			)
			.lean();

		// Cache object if needed
		if (cacheKey && result) {
			setKey(cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Gets list of objects matching the query from the database
	 * @param  {Object} query The database filter query
	 * @param  {Object} session The database session object
	 * @param  {string} projection The additonal hidden fields to return
	 * @param  {string} cacheKey Checks the cache with the give key and if found returns value from the cache
	 * @param  {string} lookup The path of the field to lookup or a lookup configuration object
	 * @param  {string} sort The sort field and direction {fieldname: 1/-1}
	 * @param  {number} skip Specifies the number of documents to skip
	 * @param  {number} limit Specifies the maximum number of documents the query will return.
	 */
	async getManyByQuery(
		query,
		{
			session = null,
			projection = null,
			cacheKey,
			lookup,
			lookup2,
			sort,
			skip,
			limit,
		} = {}
	) {
		// See if we have a value for the key in redis
		if (cacheKey) {
			const value = await getKey(cacheKey);
			if (value) return value;
		}

		let result = await this.model
			.find(query, projection, { session })
			.populate(
				lookup
					? typeof lookup === "object"
						? lookup
						: { path: lookup }
					: undefined
			)
			.populate(
				lookup2
					? typeof lookup2 === "object"
						? lookup2
						: { path: lookup2 }
					: undefined
			)
			.sort(sort)
			.skip(skip)
			.limit(limit)
			.lean();

		// Cache object if needed
		if (cacheKey && result) {
			setKey(cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Creates a new object in the database
	 * @param  {Object} data The object data
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async create(data, options = {}) {
		let result = (await new this.model(data).save(options)).toJSON();
		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Creates multiple objects in the database
	 * @param  {Array} data The array of objects to create in the database
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async createMany(data, options = {}) {
		let result = await this.model.insertMany(data, options);
		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Updates the first object matching the query in the database
	 * @param  {Object} query The database filter query
	 * @param  {Object} dataSet The field updates
	 * @param  {Object} dataUnset The fields to remove
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async updateOneByQuery(query, dataSet, dataUnset = {}, options = {}) {
		let result = await this.model
			.findOneAndUpdate(
				query,
				{
					$set: dataSet,
					$unset: dataUnset,
				},
				{
					new: true, //return the updated object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Updates the object with the id in the database
	 * @param  {string} id The id of the object to update
	 * @param  {Object} dataSet The field updates
	 * @param  {Object} dataUnset The fields to remove
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async updateOneById(id, dataSet, dataUnset = {}, options = {}) {
		let result = await this.model
			.findByIdAndUpdate(
				id,
				{
					$set: dataSet,
					$unset: dataUnset,
				},
				{
					new: true, //return the updated object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Updates the objects matching the query in the database
	 * @param  {Object} query The database filter query
	 * @param  {Object} dataSet The field updates
	 * @param  {Object} dataUnset The fields to remove
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async updateMultiByQuery(query, dataSet, dataUnset = {}, options = {}) {
		return await this.model
			.updateMany(
				query,
				{
					$set: dataSet,
					$unset: dataUnset,
				},
				{
					new: true, //return the updated object
					...options,
				}
			)
			.lean();
	}

	/**
	 * Adds the object to the sub-object list of the model in the database
	 * @param  {string} parentId The id of the parent object
	 * @param  {string} field The sub-object array field name
	 * @param  {Object} data The sub-object data to add
	 * @param  {Object} dataSet The field updates on the parent object
	 * @param  {Object} options The options to pass to the the database driver
	 * @param  {Object} dataIncSet The field updates on the parent object
	 */
	async pushObjectById(
		parentId,
		field,
		data,
		dataSet = {},
		options = {},
		dataIncSet = {}
	) {
		let result = await this.model
			.findByIdAndUpdate(
				parentId,
				{
					$push: { [field]: Array.isArray(data) ? { $each: data } : data },
					$set: dataSet,
					$inc: dataIncSet,
				},
				{
					new: true, //return the updated parent object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Adds the object to the sub-object list of the model in the database
	 * @param  {Object} query The database filter query
	 * @param  {string} field The sub-object array field name
	 * @param  {Object} data The sub-object data to add
	 * @param  {Object} dataSet The field updates on the parent object
	 * @param  {Object} options The options to pass to the the database driver
	 * @param  {Object} dataIncSet The field updates on the parent object
	 */
	async pushObjectByQuery(
		query,
		field,
		data,
		dataSet = {},
		options = {},
		dataIncSet = {}
	) {
		let result = await this.model
			.findOneAndUpdate(
				query,
				{
					$push: { [field]: Array.isArray(data) ? { $each: data } : data },
					$set: dataSet,
					$inc: dataIncSet,
				},
				{
					new: true, //return the updated parent object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Removes the object from the sub-object list of the model in the database
	 * @param  {string} parentId The id of the parent object
	 * @param  {string} field The sub-object array field name
	 * @param  {string} objectId The id of the sub-object to remove
	 * @param  {Object} dataSet The field updates on the parent object
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async pullObjectById(parentId, field, objectId, dataSet = {}, options = {}) {
		let result = await this.model
			.findByIdAndUpdate(
				parentId,
				{
					$pull: { [field]: { _id: objectId } },
					$set: dataSet,
				},
				{
					new: true, //return the updated parent object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Removes the object from the sub-object list of the model in the database
	 * @param  {string} parentId The id of the parent object
	 * @param  {string} field The sub-object array field name
	 * @param  {Object} query The database filter query
	 * @param  {Object} dataSet The field updates on the parent object
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async pullObjectByQuery(parentId, field, query, dataSet = {}, options = {}) {
		let result = await this.model
			.findByIdAndUpdate(
				parentId,
				{
					$pull: { [field]: query },
					$set: dataSet,
				},
				{
					new: true, //return the updated parent object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Removes the object from the sub-object list of the model in the database.
	 * This is useful to remove objects deep in sub-object-list hierarchy (e.g., removing a validation rule from a field)
	 * @param  {Object} query1 The database filter query
	 * @param  {string} field The sub-object array field name
	 * @param  {Object} query2 The database filter query
	 * @param  {Object} dataSet The field updates on the parent object
	 * @param  {Object} options The options to pass to the the database driver
	 */
	async pullObjectByQuery2(query1, field, query2, dataSet = {}, options = {}) {
		let result = await this.model
			.findOneAndUpdate(
				query1,
				{
					$pull: { [field]: query2 },
					$set: dataSet,
				},
				{
					new: true, //return the updated parent object
					...options,
				}
			)
			.lean();

		// Cache object if needed
		if (options.cacheKey && result) {
			setKey(options.cacheKey, result, helper.constants["1month"]);
		}

		return result;
	}

	/**
	 * Deletes the first object data matches the query from the database
	 * @param  {Object} query The database filter query
	 * @param  {Object} session The database session object
	 * @param  {string} cacheKey Clears the cache with the given key
	 */
	async deleteOneByQuery(query, { session = null, cacheKey } = {}) {
		let result = await this.model.deleteOne(query, { session });
		// Cache object if needed
		if (cacheKey) {
			deleteKey(cacheKey);
		}

		return result;
	}

	/**
	 * Deletes a single document identified by its _id field
	 * @param  {string} id The object identifer
	 * @param  {Object} session The database session object
	 * @param  {string} cacheKey Clears the cache with the given key
	 */
	async deleteOneById(id, { session = null, cacheKey } = {}) {
		let result = await this.model.deleteOne(
			{ _id: id },
			{
				session,
			}
		);
		// Cache object if needed
		if (cacheKey) {
			deleteKey(cacheKey);
		}

		return result;
	}

	/**
	 * Deletes a single document identified by its _id field
	 * @param  {string} id The object identifer
	 * @param  {Object} session The database session object
	 * @param  {string | Array} cacheKey Clears the cache with the given key(s)
	 */
	async deleteManyByQuery(query, { session = null, cacheKey } = {}) {
		let result = await this.model.deleteMany(query, {
			session,
		});

		// Delete caches object
		if (cacheKey) {
			if (Array.isArray(cacheKey))
				cacheKey.forEach((element) => {
					deleteKey(element);
				});
			else deleteKey(cacheKey);
		}

		return result;
	}
}
