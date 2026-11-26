import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService (Unit Test - API-T02)', () => {
  let service: AuthService;
  let usersStore: Map<string, any>;

  beforeEach(async () => {
    usersStore = new Map<string, any>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload) => `jwt.${payload.sub}.${payload.role}`),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn().mockImplementation(({ where }) => {
                return Promise.resolve(usersStore.get(where.email) || null);
              }),
              create: jest.fn().mockImplementation(({ data }) => {
                const user = {
                  id: `usr_${usersStore.size + 1}`,
                  role: 'CUSTOMER',
                  ...data,
                };
                usersStore.set(user.email, user);
                return Promise.resolve(user);
              }),
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('FR-04 / NFR-02: should hash password with bcrypt and issue JWT on register', async () => {
    const res = await service.register({
      email: 'student@sgu.edu.vn',
      password: 'Password123',
      fullName: 'Trần Thanh Khoa',
    });

    expect(res.accessToken).toContain('jwt.');
    expect(res.user.email).toBe('student@sgu.edu.vn');

    const stored = usersStore.get('student@sgu.edu.vn');
    expect(stored.passwordHash).not.toBe('Password123');
    expect(await bcrypt.compare('Password123', stored.passwordHash)).toBe(true);
  });

  it('FR-04: should reject duplicate email registration', async () => {
    await service.register({
      email: 'dup@sgu.edu.vn',
      password: 'Password123',
      fullName: 'User One',
    });

    await expect(
      service.register({
        email: 'dup@sgu.edu.vn',
        password: 'Password123',
        fullName: 'User Two',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('FR-04: should authenticate valid credentials and reject invalid password', async () => {
    await service.register({
      email: 'login@sgu.edu.vn',
      password: 'Secret123',
      fullName: 'Tester',
    });

    const ok = await service.login({ email: 'login@sgu.edu.vn', password: 'Secret123' });
    expect(ok.accessToken).toBeDefined();
    expect(ok.user.role).toBe('CUSTOMER');

    await expect(
      service.login({ email: 'login@sgu.edu.vn', password: 'WrongPassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
