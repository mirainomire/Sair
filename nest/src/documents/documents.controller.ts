import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiCommonErrors, apiJson } from '../common/api-docs';
import { DocumentsService } from './documents.service';

const signedOut = [{ summary: 'No token, or a token the server cannot verify', message: 'Sign in first.' }];

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'Pilot documents and expiry state' })
  @apiJson(200, 'state is safe, soon, or expired. soon means the expiry is within 30 days. expired means daysRemaining is 0 or less.', {
    data: {
      referenceDate: '2026-05-15',
      warningDays: 30,
      documents: [
        { id: 'doc_recurrent', label: 'Next Recurrent Date', expiryDate: '2026-10-14', daysRemaining: 152, state: 'safe' },
        { id: 'doc_ppc', label: 'PPC Exp. Date', expiryDate: '2026-12-25', daysRemaining: 224, state: 'safe' },
        { id: 'doc_license', label: 'Indonesian License Exp. Date', expiryDate: '2026-05-29', daysRemaining: 14, state: 'soon' },
        { id: 'doc_medical', label: 'Indonesian Medical Exp. Date', expiryDate: '2026-06-11', daysRemaining: 27, state: 'soon' },
        { id: 'doc_security', label: 'Security Clearance Exp. Date', expiryDate: '2026-05-01', daysRemaining: -14, state: 'expired' },
      ],
    },
  })
  @ApiCommonErrors([], signedOut)
  list() {
    return this.documents.list();
  }
}
