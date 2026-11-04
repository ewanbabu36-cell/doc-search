/**
 * ABDM (Ayushman Bharat Digital Mission) National Health Gateway Service
 * Implements M1, M2, and M3 Milestones conforming to ABDM Sandbox & Production API Specs.
 */

import { AbdmGatewayService } from '../partner/AbdmGatewayService.js';

export { AbdmGatewayService } from '../partner/AbdmGatewayService.js';
export const abdmGatewayService = new AbdmGatewayService();
export { nhaAbdmClient, type NhaGatewayHealth } from '../partner/NhaAbdmClient.js';
