import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
  Put,
} from '@nestjs/common';
import { Request } from 'express';

import { CustomFieldService } from './customField.service';
import { ResponseFormatService } from '../../shared/services/response-format.service';
import { ResponseFormat } from '../../interfaces/IResponseFormat';
import { AddCustomFieldDto } from './dto/AddCustomFieldDto';
import { CheckUniqueIdDto } from './dto/CheckUniqueIdDto';
import { GetCustomFieldsDto } from './dto/GetCustomFieldsDto';
import { GetRoleOptionsDto } from './dto/GetRoleOptionsDto';
import { GetCustomFieldsListCountsDto } from './dto/GetCustomFieldsListCountsDto';
import { PermissionsGuard } from '../../guards/permissions.guard';
import { Permissions } from '../../decorators/permissions.decorator';
import { RoleLevelEnum } from '../../enum/role-level.enum';
import { RequestPermissionsKey } from '../../enum/request-permissions-key.enum';
import { PERMISSIONS_KEYS } from '../../common/constants/constants';
import { PermissionsCondition } from '../../enum/permissions-condition.enum';
import { PermissionsService } from '../../shared/services/permissions.service';
import { GetFieldDataPermissionsDto } from './dto/GetFieldDataPermissionsDto';
import { CustomFieldIntegrationService } from './customFieldIntegration.service';
import { GetCustomFieldIntegrationsDto } from './dto/GetCustomFieldIntegrationsDto';
import { map, orderBy, groupBy, head } from 'lodash';
import { GetCustomFieldIntegrationsWithDataDto } from './dto/GetCustomFieldIntegrationsWithDataDto';
import { CustomFieldDataService } from './customFieldData.service';
import { GetCustomFieldDataDto } from './dto/GetCustomFieldDataDto';
import { PutCustomFieldDataBodyDto } from './dto/PutCustomFieldDataBodyDto';
import { OpportunityFieldLinkageService } from './opportunityFieldLinkage.service';
import { OpportunityService } from '../opportunity/opportunity.service';
import { GetCustomFieldsDataCountsDto } from './dto/GetCustomFieldsDataCountsDto';

@Controller('custom-field')
@UseGuards(PermissionsGuard)
export class CustomFieldController {
  constructor(
    private readonly customFieldService: CustomFieldService,
    private readonly permissionsService: PermissionsService,
    private readonly customFieldIntegrationService: CustomFieldIntegrationService,
    private readonly customFieldDataService: CustomFieldDataService,
    private readonly opportunityFieldLinkageService: OpportunityFieldLinkageService,
    public opportunityService: OpportunityService,
  ) {}

  @Post()
  @Permissions(
    RoleLevelEnum.community,
    RequestPermissionsKey.BODY,
    'community',
    [PERMISSIONS_KEYS.createCustomField],
    PermissionsCondition.AND,
  )
  async addCustomField(
    @Body() body: AddCustomFieldDto,
  ): Promise<ResponseFormat> {
    const response = await this.customFieldService.addCustomField(body);
    return ResponseFormatService.responseOk(response, 'Created Successfully');
  }

  @Get()
  async getAllCustomFields(
    @Query() queryparams: GetCustomFieldsDto,
  ): Promise<ResponseFormat> {
    const customFields = await this.customFieldService.getCustomFieldsWithFilters(
      queryparams,
    );
    return ResponseFormatService.responseOk(customFields, 'All');
  }

  @Get('list-counts')
  async getCustomFieldsListCounts(
    @Query() queryparams: GetCustomFieldsListCountsDto,
  ): Promise<ResponseFormat> {
    const counts = await this.customFieldService.getCustomFieldsListCounts(
      queryparams,
    );
    return ResponseFormatService.responseOk(counts, 'List Counts');
  }

  @Get('data-counts')
  async getCustomFieldsDataCounts(
    @Query() queryparams: GetCustomFieldsDataCountsDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    // Get all community opportunities.
    let opportunities = await this.opportunityService.getSimpleOpportunities({
      where: { community: queryparams.community, isDeleted: false },
    });

    // Filter out the opportunities that shouldn't be visible to the current user.
    const oppPermissions = await Promise.all(
      opportunities.map(val =>
        this.opportunityService.getOpportunityPermissions(
          val.id,
          req['userData'].id,
          true,
        ),
      ),
    );
    const permGrouped = groupBy(oppPermissions, 'opportunityId');
    opportunities = opportunities.filter(
      opportunity =>
        head(permGrouped[opportunity.id])['permissions'].viewOpportunity,
    );

    // Get data counts out of the selected opportunities.
    const dataCounts = await this.customFieldDataService.getFieldsDataCounts({
      community: queryparams.community,
      fields: queryparams.fields,
      opportunities: opportunities,
      opportunitiesCount: opportunities.length,
    });
    return ResponseFormatService.responseOk(dataCounts, 'All');
  }

  @Get('check-unique-id')
  @Permissions(
    RoleLevelEnum.community,
    RequestPermissionsKey.QUERY,
    'community',
    [PERMISSIONS_KEYS.createCustomField],
    PermissionsCondition.AND,
  )
  async checkUniqueId(
    @Query() queryparams: CheckUniqueIdDto,
  ): Promise<ResponseFormat> {
    const isUnique = await this.customFieldService.checkUniqueId(queryparams);
    return ResponseFormatService.responseOk(
      isUnique,
      isUnique ? 'ID is unique.' : 'ID already exists.',
    );
  }

  @Get('role-options')
  async getRoleOptions(
    @Query() queryparams: GetRoleOptionsDto,
  ): Promise<ResponseFormat> {
    const roles = await this.customFieldService.getRoleOptions(queryparams);
    return ResponseFormatService.responseOk(
      roles,
      `Potential role options for Custom Field's Edit and Visibility settings.`,
    );
  }

  @Get('types')
  async getAllCustomFieldTypes(): Promise<ResponseFormat> {
    const options = {
      where: { isDeleted: false },
    };
    const customFieldTypes = await this.customFieldService.getCustomFieldTypes(
      options,
    );
    return ResponseFormatService.responseOk(customFieldTypes, 'All');
  }

  @Get('types/:id')
  async getCustomFieldType(@Param('id') id: string): Promise<ResponseFormat> {
    const customFieldType = await this.customFieldService.getOneCustomFieldType(
      {
        id: id,
      },
    );
    return ResponseFormatService.responseOk(customFieldType, 'Result');
  }

  @Get('permissions')
  async getPermissions(
    @Query() queryparams: GetFieldDataPermissionsDto,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const permissions = await this.customFieldService.getPermissions(
      queryparams.customFields,
      queryparams.opportunity,
      req['userData'].id,
    );
    return ResponseFormatService.responseOk(permissions, 'All');
  }

  @Get('integration')
  async getCustomFieldIntegrations(
    @Query() queryparams: GetCustomFieldIntegrationsDto,
  ): Promise<ResponseFormat> {
    const entityFields = await this.customFieldIntegrationService.getCustomFieldIntegrations(
      {
        relations: ['field', 'field.customFieldType'],
        where: queryparams,
        order: { order: 'ASC' },
      },
    );

    return ResponseFormatService.responseOk(
      entityFields,
      'All Entity Custom Fields',
    );
  }

  @Get('integration-with-data')
  async getCustomFieldIntegrationsWithData(
    @Query() queryparams: GetCustomFieldIntegrationsWithDataDto,
  ): Promise<ResponseFormat> {
    const integrationsWithData = await this.customFieldIntegrationService.getCustomFieldIntegrationsWithFilters(
      {
        ...queryparams,
        checkOpportunity: true,
        includeData: true,
      },
    );

    const excludeFieldIds = map(integrationsWithData, 'field.id');

    const integrationsWithoutData = await this.customFieldIntegrationService.getCustomFieldIntegrationsWithFilters(
      {
        ...queryparams,
        ...(excludeFieldIds.length && { excludeFieldIds }),
        includeData: false,
        checkOpportunity: false,
      },
    );

    const integrationsData = [
      ...integrationsWithData,
      ...integrationsWithoutData,
    ];
    const integrationsDataSorted = orderBy(integrationsData, 'order', 'asc');

    return ResponseFormatService.responseOk(
      integrationsDataSorted,
      'All Custom Fields Integrations with Data.',
    );
  }

  @Get('opportunity-linked')
  async getCustomFieldLinkedWithOpportunity(
    @Query() queryparams: GetCustomFieldDataDto,
  ): Promise<ResponseFormat> {
    const linkedFieldsWithData = await this.opportunityFieldLinkageService.getOpportunityFieldLinkages(
      { ...queryparams, includeData: true },
    );

    const excludeFieldIds = map(linkedFieldsWithData, 'field.id');

    const linkedFieldsWithoutData = await this.opportunityFieldLinkageService.getOpportunityFieldLinkages(
      {
        ...queryparams,
        includeData: false,
        ...(excludeFieldIds.length && { excludeFieldIds }),
      },
    );

    return ResponseFormatService.responseOk(
      [...linkedFieldsWithData, ...linkedFieldsWithoutData],
      'All Custom Fields Linked with Opportunity.',
    );
  }

  @Get('data')
  async getCustomFieldData(
    @Query() queryparams: GetCustomFieldDataDto,
  ): Promise<ResponseFormat> {
    const options = {
      relations: ['opportunity'],
      where: queryparams,
    };
    const fieldData = await this.customFieldDataService.getCustomFieldData(
      options,
    );
    return ResponseFormatService.responseOk(fieldData, 'Custom Field Data');
  }

  @Put('data')
  async putCustomFieldData(
    @Query() queryparams: GetCustomFieldDataDto,
    @Body() body: PutCustomFieldDataBodyDto,
  ): Promise<ResponseFormat> {
    const fieldData = await this.customFieldDataService.addOrUpdateCustomFieldData(
      queryparams,
      body.data,
    );
    return ResponseFormatService.responseOk(fieldData, 'Custom Field Data');
  }

  @Get(':id')
  async getCustomField(@Param('id') id: string): Promise<ResponseFormat> {
    const customField = await this.customFieldService.getOneCustomField({
      id: id,
    });
    return ResponseFormatService.responseOk(customField, 'Result');
  }

  @Patch(':id')
  @Permissions(
    RoleLevelEnum.community,
    RequestPermissionsKey.BODY,
    'community',
    [PERMISSIONS_KEYS.editCustomField, PERMISSIONS_KEYS.editCustomFieldOptions],
    PermissionsCondition.OR,
  )
  async updateCustomField(
    @Param('id') id: string,
    @Body() body: AddCustomFieldDto,
  ): Promise<ResponseFormat> {
    const updateData = await this.customFieldService.updateCustomField(
      { id: id },
      body,
    );
    return ResponseFormatService.responseOk(updateData, 'Update Result');
  }

  @Delete(':id')
  async archiveCustomField(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<ResponseFormat> {
    const existingField = await this.customFieldService.getOneCustomField({
      where: { id },
    });
    if (existingField) {
      await this.permissionsService.verifyPermissions(
        RoleLevelEnum.community,
        existingField.communityId,
        req['userData'].id,
        [PERMISSIONS_KEYS.softDeleteCustomField],
        PermissionsCondition.AND,
      );
    }
    const deleteData = await this.customFieldService.archiveCustomField({
      id: id,
    });
    return ResponseFormatService.responseOk(deleteData, 'Archive Result');
  }
}
