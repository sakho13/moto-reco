import { CompanyCategory, createCompanyId } from '@repo/shared-types'
import { CompanyEntity } from '../entities/CompanyEntity'
import { ICompanyRepository } from '../interfaces/ICompanyRepository'
import { PrismaRepositoryBase } from './PrismaRepositoryBase'

export class PrismaCompanyRepository
  extends PrismaRepositoryBase
  implements ICompanyRepository
{
  async findAll(params?: {
    category?: CompanyCategory
  }): Promise<CompanyEntity[]> {
    const companies = await this.connection.mCompany.findMany({
      where: params?.category
        ? { categories: { has: params.category } }
        : undefined,
      orderBy: { name: 'asc' },
    })

    return companies.map(
      (company) =>
        new CompanyEntity({
          id: createCompanyId(company.id),
          name: company.name,
          nameEn: company.nameEn,
          logoUrl: company.logoUrl,
          websiteUrl: company.websiteUrl,
          country: company.country,
          categories: company.categories,
          isActive: company.isActive,
        })
    )
  }
}
