/**
 * Классический Singleton: пользователь-создатель зафиксирован константой.
 * Используется во всех методах вместо реальной авторизации (она появится в ЛР4).
 */
export class CurrentUserProvider {
  private static instance: CurrentUserProvider;

  private readonly userId: number = 1; // m.rybin — фиксированный "текущий" пользователь

  private constructor() {}

  static getInstance(): CurrentUserProvider {
    if (!CurrentUserProvider.instance) {
      CurrentUserProvider.instance = new CurrentUserProvider();
    }
    return CurrentUserProvider.instance;
  }

  getCurrentUserId(): number {
    return this.userId;
  }
}
