interface FilterNullOrUndefinedFunction<T> {
  (arr: T[]): NonNullable<T>[]
}
