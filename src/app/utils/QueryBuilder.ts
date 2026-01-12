import { Query } from "mongoose";
import { excludeField } from "../constants";

export class QueryBuilder<T> {
  public modelQuery: Query<T[], T>;
  public readonly query: Record<string, string>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, string>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  filter(): this {
    const filter = { ...this.query };

    for (const field of excludeField) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete filter[field];
    }

    this.modelQuery = this.modelQuery.find(filter); // Tour.find().find(filter)

    return this;
  }

  //   search(searchableField: string[]): this {
  //     const searchTerm = this.query.searchTerm || "";
  //     const searchQuery = {
  //       $or: searchableField.map((field) => ({
  //         [field]: { $regex: searchTerm, $options: "i" },
  //       })),
  //     };
  //     this.modelQuery = this.modelQuery.find(searchQuery);
  //     return this;
  //   }

  search(searchableField: string[]): this {
    const searchTerm = this.query.searchTerm || "";

    if (searchTerm) {
      const searchQuery = {
        $or: searchableField.map((field) => ({
          [field]: { $regex: searchTerm, $options: "i" },
        })),
      };

      // Get current filter
      const currentFilter = this.modelQuery.getFilter();

      // Check if current filter already has $or
      if (currentFilter.$or) {
        // Merge with existing $or
        const mergedOr = [...currentFilter.$or, ...searchQuery.$or];
        const combinedFilter = {
          ...currentFilter,
          $or: mergedOr,
        };
        this.modelQuery = this.modelQuery.find(combinedFilter);
      } else if (Object.keys(currentFilter).length > 0) {
        // Combine filters with $and
        const combinedFilter = {
          $and: [currentFilter, searchQuery],
        };
        this.modelQuery = this.modelQuery.find(combinedFilter);
      } else {
        // No existing filter, just use search
        this.modelQuery = this.modelQuery.find(searchQuery);
      }
    }

    return this;
  }

  sort(): this {
    const sort = this.query.sort || "-createdAt";

    this.modelQuery = this.modelQuery.sort(sort);

    return this;
  }
  fields(): this {
    const fields = this.query.fields?.split(",").join(" ") || "";

    this.modelQuery = this.modelQuery.select(fields);

    return this;
  }
  paginate(): this {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);

    return this;
  }

  build() {
    return this.modelQuery;
  }

  // async getMeta() {
  //     const totalDocuments = await this.modelQuery.model.countDocuments()

  //     const page = Number(this.query.page) || 1
  //     const limit = Number(this.query.limit) || 10

  //     const totalPage = Math.ceil(totalDocuments / limit)

  //     return { page, limit, total: totalDocuments, totalPage }
  // }
  async getMeta() {
    // Get the query filter that was applied
    const queryFilter = this.modelQuery.getFilter();

    // Count documents matching the filter
    const totalDocuments = await this.modelQuery.model.countDocuments(
      queryFilter
    );

    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const totalPage = Math.ceil(totalDocuments / limit);

    return {
      page,
      limit,
      total: totalDocuments,
      totalPage,
      hasNextPage: page < totalPage,
      hasPrevPage: page > 1,
    };
  }
}
