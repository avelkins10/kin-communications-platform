import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/contacts/route'
import { testUtils, prismaMock } from '../setup'

// Mock NextAuth
vi.mock('next-auth', () => ({
  auth: vi.fn(() => Promise.resolve({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER'
    }
  }))
}))

// Mock Prisma
vi.mock('@/lib/db', () => ({ prisma: prismaMock }))

describe('/api/contacts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await testUtils.cleanup()
  })

  describe('GET /api/contacts', () => {
    it('should return contacts for authenticated user', async () => {
      // Mock Prisma response
      prismaMock.contact.findMany.mockResolvedValue([
        {
          id: 'contact-1',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+15551234567',
          email: 'john.doe@example.com',
          department: 'Sales',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      const request = new NextRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contacts).toHaveLength(1)
      expect(data.contacts[0].firstName).toBe('John')
      expect(data.contacts[0].lastName).toBe('Doe')
    })

    it('should handle search query parameter', async () => {
      prismaMock.contact.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/contacts?search=John')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prismaMock.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({
                firstName: expect.objectContaining({
                  contains: 'John'
                })
              })
            ])
          })
        })
      )
    })

    it('should handle pagination', async () => {
      prismaMock.contact.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/contacts?page=2&limit=10')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prismaMock.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10
        })
      )
    })

    it('should return 401 for unauthenticated user', async () => {
      // Mock unauthenticated user
      vi.mocked(require('next-auth').auth).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })
  })

  describe('POST /api/contacts', () => {
    it('should create a new contact', async () => {
      const newContact = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+15551234568',
        email: 'jane.smith@example.com',
        department: 'Marketing'
      }

      prismaMock.contact.create.mockResolvedValue({
        id: 'new-contact-id',
        ...newContact,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: JSON.stringify(newContact),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.contact.firstName).toBe('Jane')
      expect(data.contact.lastName).toBe('Smith')
      expect(prismaMock.contact.create).toHaveBeenCalledWith({
        data: expect.objectContaining(newContact)
      })
    })

    it('should validate required fields', async () => {
      const invalidContact = {
        firstName: '',
        lastName: 'Smith',
        phone: 'invalid-phone',
        email: 'invalid-email'
      }

      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: JSON.stringify(invalidContact),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
      expect(data.errors).toBeDefined()
    })

    it('should handle duplicate phone numbers', async () => {
      prismaMock.contact.findFirst.mockResolvedValue({
        id: 'existing-contact',
        phone: '+15551234567'
      })

      const newContact = {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales'
      }

      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: JSON.stringify(newContact),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.error).toContain('Phone number already exists')
    })
  })

  describe('PUT /api/contacts/[id]', () => {
    it('should update an existing contact', async () => {
      const contactId = 'contact-1'
      const updateData = {
        firstName: 'John Updated',
        lastName: 'Doe Updated',
        phone: '+15551234567',
        email: 'john.updated@example.com',
        department: 'Sales'
      }

      prismaMock.contact.findUnique.mockResolvedValue({
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      prismaMock.contact.update.mockResolvedValue({
        id: contactId,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const request = new NextRequest(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request, { params: { id: contactId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.contact.firstName).toBe('John Updated')
      expect(data.contact.lastName).toBe('Doe Updated')
    })

    it('should return 404 for non-existent contact', async () => {
      const contactId = 'non-existent-id'
      
      prismaMock.contact.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request, { params: { id: contactId } })

      expect(response.status).toBe(404)
    })

    it('should validate update data', async () => {
      const contactId = 'contact-1'
      const invalidData = {
        firstName: '',
        email: 'invalid-email'
      }

      prismaMock.contact.findUnique.mockResolvedValue({
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const request = new NextRequest(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'PUT',
        body: JSON.stringify(invalidData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await PUT(request, { params: { id: contactId } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('DELETE /api/contacts/[id]', () => {
    it('should delete an existing contact', async () => {
      const contactId = 'contact-1'

      prismaMock.contact.findUnique.mockResolvedValue({
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      prismaMock.contact.delete.mockResolvedValue({
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const request = new NextRequest(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: contactId } })

      expect(response.status).toBe(204)
      expect(prismaMock.contact.delete).toHaveBeenCalledWith({
        where: { id: contactId }
      })
    })

    it('should return 404 for non-existent contact', async () => {
      const contactId = 'non-existent-id'
      
      prismaMock.contact.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: contactId } })

      expect(response.status).toBe(404)
    })

    it('should handle database errors', async () => {
      const contactId = 'contact-1'

      prismaMock.contact.findUnique.mockResolvedValue({
        id: contactId,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+15551234567',
        email: 'john.doe@example.com',
        department: 'Sales',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      prismaMock.contact.delete.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/contacts/${contactId}`, {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: contactId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Database error')
    })
  })

  describe('Error Handling', () => {
    it('should handle Prisma errors gracefully', async () => {
      prismaMock.contact.findMany.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('Database connection failed')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: 'invalid-json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid JSON')
    })

    it('should handle missing content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/contacts', {
        method: 'POST',
        body: JSON.stringify({ firstName: 'John' })
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Content-Type must be application/json')
    })
  })

  describe('Authorization', () => {
    it('should allow admin users to access all contacts', async () => {
      // Mock admin user
      vi.mocked(require('next-auth').auth).mockResolvedValue({
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'ADMIN'
        }
      })

      prismaMock.contact.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('should restrict regular users to their own contacts', async () => {
      // Mock regular user
      vi.mocked(require('next-auth').auth).mockResolvedValue({
        user: {
          id: 'regular-user-id',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'USER'
        }
      })

      prismaMock.contact.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/contacts')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(prismaMock.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: 'regular-user-id'
          })
        })
      )
    })
  })
})
