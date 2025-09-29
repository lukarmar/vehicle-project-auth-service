export class User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  keycloakId?: string;
  
  constructor(
    email: string,
    firstName: string,
    lastName: string,
    keycloakId?: string
  ) {
    this.id = this.generateUuid();
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.keycloakId = keycloakId;
  }
  
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
  
  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
  
  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }
  
  updateInfo(firstName?: string, lastName?: string): void {
    if (firstName) this.firstName = firstName;
    if (lastName) this.lastName = lastName;
    this.updatedAt = new Date();
  }
  
  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}