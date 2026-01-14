export enum CategoryType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
  TRANSFER = "TRANSFER",
}

export interface ICategory {
  _id?: string; // Optional for new creations, present in fetched
  name: string;
  type: CategoryType;
  flexibility: "FIXED" | "VARIABLE";
  icon?: string;
  color?: string;
  group?: string;
  bucket?: "NEEDS" | "WANTS" | "SAVINGS";
  isDeleted: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
