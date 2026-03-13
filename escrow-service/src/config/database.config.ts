import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// Import Prisma types dynamically to avoid import issues
declare const require: any;
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  get client(): any {
    return this.prisma;
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  // Delegate PrismaClient methods
  get $transaction() {
    return this.prisma.$transaction.bind(this.prisma);
  }

  get user() {
    return this.prisma.user;
  }

  get project() {
    return this.prisma.project;
  }

  get transaction() {
    return this.prisma.transaction;
  }

  get milestone() {
    return this.prisma.milestone;
  }
}
