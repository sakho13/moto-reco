import { CompanyCategory } from '@repo/shared-types'
import { CompanyEntity } from '../entities/CompanyEntity'

export interface ICompanyRepository {
  findAll(params?: { category?: CompanyCategory }): Promise<CompanyEntity[]>
}
