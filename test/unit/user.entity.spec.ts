import { User } from '@domain/entities/user.entity';

describe('User Entity', () => {
  describe('constructor', () => {
    it('should create a new user with valid data', () => {
      const email = 'test@example.com';
      const firstName = 'John';
      const lastName = 'Doe';
      const keycloakId = 'keycloak-123';

      const user = new User(email, firstName, lastName, keycloakId);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.firstName).toBe(firstName);
      expect(user.lastName).toBe(lastName);
      expect(user.keycloakId).toBe(keycloakId);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user without keycloakId', () => {
      const email = 'test@example.com';
      const firstName = 'John';
      const lastName = 'Doe';

      const user = new User(email, firstName, lastName);

      expect(user).toBeDefined();
      expect(user.keycloakId).toBeUndefined();
    });

    it('should generate a unique UUID for id', () => {
      const user1 = new User('test1@example.com', 'John', 'Doe');
      const user2 = new User('test2@example.com', 'Jane', 'Doe');

      expect(user1.id).not.toBe(user2.id);
      expect(user1.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('fullName getter', () => {
    it('should return the full name correctly', () => {
      const user = new User('test@example.com', 'John', 'Doe');

      expect(user.fullName).toBe('John Doe');
    });

    it('should handle empty names', () => {
      const user = new User('test@example.com', '', '');

      expect(user.fullName).toBe(' ');
    });
  });

  describe('deactivate', () => {
    it('should deactivate the user', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalUpdatedAt = user.updatedAt;

      setTimeout(() => {
        user.deactivate();

        expect(user.isActive).toBe(false);
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should update updatedAt when deactivating', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalUpdatedAt = user.updatedAt;

      user.deactivate();

      expect(user.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('activate', () => {
    it('should activate a deactivated user', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      user.deactivate();
      const originalUpdatedAt = user.updatedAt;

      setTimeout(() => {
        user.activate();

        expect(user.isActive).toBe(true);
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should update updatedAt when activating', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      user.deactivate();
      const originalUpdatedAt = user.updatedAt;

      user.activate();

      expect(user.updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('updateInfo', () => {
    it('should update firstName and lastName', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalUpdatedAt = user.updatedAt;

      setTimeout(() => {
        user.updateInfo('Jane', 'Smith');

        expect(user.firstName).toBe('Jane');
        expect(user.lastName).toBe('Smith');
        expect(user.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 1);
    });

    it('should update only firstName when lastName is not provided', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalLastName = user.lastName;

      user.updateInfo('Jane');

      expect(user.firstName).toBe('Jane');
      expect(user.lastName).toBe(originalLastName);
    });

    it('should update only lastName when firstName is not provided', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalFirstName = user.firstName;

      user.updateInfo(undefined, 'Smith');

      expect(user.firstName).toBe(originalFirstName);
      expect(user.lastName).toBe('Smith');
    });

    it('should not update when no parameters provided', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalFirstName = user.firstName;
      const originalLastName = user.lastName;
      const originalUpdatedAt = user.updatedAt;

      user.updateInfo();

      expect(user.firstName).toBe(originalFirstName);
      expect(user.lastName).toBe(originalLastName);
      expect(user.updatedAt).not.toBe(originalUpdatedAt); // updatedAt still changes
    });

    it('should update updatedAt timestamp', () => {
      const user = new User('test@example.com', 'John', 'Doe');
      const originalUpdatedAt = user.updatedAt;

      user.updateInfo('Jane', 'Smith');

      expect(user.updatedAt).not.toBe(originalUpdatedAt);
    });
  });
});