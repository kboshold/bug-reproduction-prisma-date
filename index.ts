import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './prisma/client/client'
import { z } from 'zod'
import chalk from 'chalk'

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

const dateSchema = z.date()

const testDates = [
  new Date('0031-01-01T00:00:00.000Z'),
  new Date('0032-01-01T00:00:00.000Z'), 
  new Date('0040-01-01T00:00:00.000Z'),
  new Date('0050-01-01T00:00:00.000Z'),
  new Date('0120-01-01T00:00:00.000Z')
]

async function testCreateDate(inputDate: Date) {
  try {
    const validatedDate = dateSchema.parse(inputDate)
    
    const record = await prisma.testData.create({
      data: { date: validatedDate }
    })
    
    const retrieved = await prisma.testData.findUniqueOrThrow({
      where: { id: record.id }
    })
    
    await prisma.testData.delete({ where: { id: record.id } })
    
    const originalYear = validatedDate.getFullYear()
    const retrievedYear = retrieved.date.getFullYear()
    const match = originalYear === retrievedYear
    
    const emoji = match ? '✅' : '❌'
    const color = match ? chalk.green : chalk.red
    
    console.log(`  ${emoji} CREATE ${color(inputDate.toISOString())} => ${color(retrieved.date.toISOString())} (${originalYear} -> ${retrievedYear})`)
    
  } catch (error) {
    console.log(`  ❌ CREATE ${chalk.red(inputDate.toISOString())} => Error: ${error}`)
  }
}

async function testUpdateDate(inputDate: Date) {
  try {
    const validatedDate = dateSchema.parse(inputDate)
    
    const record = await prisma.testData.create({
      data: { date: new Date('2000-01-01') }
    })
    
    const updated = await prisma.testData.update({
      where: { id: record.id },
      data: { date: validatedDate }
    })
    
    const retrieved = await prisma.testData.findUniqueOrThrow({
      where: { id: record.id }
    })
    
    await prisma.testData.delete({ where: { id: record.id } })
    
    const originalYear = validatedDate.getFullYear()
    const retrievedYear = retrieved.date.getFullYear()
    const match = originalYear === retrievedYear
    
    const emoji = match ? '✅' : '❌'
    const color = match ? chalk.green : chalk.red
    
    console.log(`  ${emoji} UPDATE ${color(inputDate.toISOString())} => ${color(retrieved.date.toISOString())} (${originalYear} -> ${retrievedYear})`)
    
  } catch (error) {
    console.log(`  ❌ UPDATE ${chalk.red(inputDate.toISOString())} => Error: ${error}`)
  }
}

async function main() {
  console.log(chalk.blue.bold('\n🔍 Prisma Date Bug Reproduction Test\n'))
  
  for (const date of testDates) {
    console.log(chalk.yellow.bold(`Testing ${date.toISOString().split('T')[0]}:`))
    await testCreateDate(date)
    await testUpdateDate(date)
    console.log()
  }
  
  await prisma.$disconnect()
  process.exit(0)
}

main()
