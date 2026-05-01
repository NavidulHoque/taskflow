export const convertToPaginatedOutput = <T>(data: T[], total: number, page: number, limit: number) => {
    return { data, total, page, limit, hasPreviousPage: page > 1, hasNextPage: page * limit < total };
}