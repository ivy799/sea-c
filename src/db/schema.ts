import { integer, pgTable, varchar, text, real, date, timestamp, smallint } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  full_name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  phone_number: varchar({ length: 20 }),
  role: smallint().notNull() 
});

export const mealPlansTable = pgTable("meal_plans", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  price_per_meal: real().notNull(),
  description: text(),
  image: varchar({ length: 255 })
});

export const testimoniesTable = pgTable("testimonies", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer().notNull().references(() => usersTable.id),
  message: text().notNull(),
  rating: integer().notNull()
});

export const subscriptionsTable = pgTable("subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user_id: integer().notNull().references(() => usersTable.id),
  meal_plan_id: integer().notNull().references(() => mealPlansTable.id),
  meal_type: smallint().notNull(),   
  total_price: real().notNull(),
  allergies: text(),
  status: varchar({ length: 50 }).notNull()
});

export const deliveryDaysTable = pgTable("delivery_days", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  subscription_id: integer().notNull().references(() => subscriptionsTable.id),
  day_of_the_week: smallint().notNull() 
});

export const subscriptionMealTypesTable = pgTable("subscription_meal_types", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  subscription_id: integer().notNull().references(() => subscriptionsTable.id),
  meal_type: smallint().notNull()
});

export const pausedSubscriptionsTable = pgTable("paused_subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  subscription_id: integer().notNull().references(() => subscriptionsTable.id),
  start_date: date().notNull(),
  end_date: date()
});

export const reactivateSubscriptionsTable = pgTable("reactivate_subscriptions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  subscription_id: integer().notNull().references(() => subscriptionsTable.id),
  reactivated_at: timestamp().notNull()
});

export enum UserRole {
  Admin = 0,
  User = 1
}
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6
}
export enum MealType {
  Breakfast = 0,
  Lunch = 1,
  Dinner = 2,
}