import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '@domain/repositories/user.repository';
import { User } from '@domain/entities/user.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { id } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { email } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async findByKeycloakId(keycloakId: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ where: { keycloakId } });
    return userEntity ? this.toDomain(userEntity) : null;
  }

  async create(user: User): Promise<User> {
    const userEntity = this.toEntity(user);
    const savedEntity = await this.userRepository.save(userEntity);
    return this.toDomain(savedEntity);
  }

  async update(user: User): Promise<User> {
    const userEntity = this.toEntity(user);
    const savedEntity = await this.userRepository.save(userEntity);
    return this.toDomain(savedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findAll(): Promise<User[]> {
    const userEntities = await this.userRepository.find();
    return userEntities.map(entity => this.toDomain(entity));
  }

  private toDomain(entity: UserEntity): User {
    const user = new User(entity.email, entity.firstName, entity.lastName, entity.keycloakId);
    user.id = entity.id;
    user.isActive = entity.isActive;
    user.createdAt = entity.createdAt;
    user.updatedAt = entity.updatedAt;
    return user;
  }

  private toEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.isActive = user.isActive;
    entity.keycloakId = user.keycloakId;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }
}