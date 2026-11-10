import { withTransaction } from '../../lib/db/index.js';
import { assertPermission, ACTIONS } from '../../lib/permissions/index.js';
import { getMemberByUserId } from '../repositories/mess-repository.js';
import {
  addShoppingItem,
  listShoppingItems,
  toggleShoppingItem,
  deleteShoppingItem,
  assignBazaarDuty,
  listBazaarRoster,
  addInventoryItem,
  listInventoryItems,
  createComplaint,
  listComplaints,
  resolveComplaint,
  createNotice,
  listNotices,
} from '../repositories/extra-features-repository.js';

// ─── Shopping List ───

export async function addShoppingItemService({ messId, actorUserId, itemName, quantity }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return addShoppingItem(client, {
      messId,
      itemName,
      quantity,
      addedByMemberId: actor.id,
    });
  });
}

export async function listShoppingItemsService({ messId, actorUserId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return listShoppingItems(client, messId);
  });
}

export async function toggleShoppingItemService({ messId, actorUserId, itemId, isPurchased }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return toggleShoppingItem(client, {
      messId,
      itemId,
      isPurchased,
      purchasedByMemberId: isPurchased ? actor.id : null,
    });
  });
}

// ─── Bazaar Roster ───

export async function assignBazaarDutyService({ messId, actorUserId, memberId, dutyDate, note }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');
    if (actor.role !== 'manager') throw new Error('Only managers can assign bazaar duty');

    return assignBazaarDuty(client, {
      messId,
      memberId,
      dutyDate,
      note,
      actorUserId,
    });
  });
}

export async function listBazaarRosterService({ messId, actorUserId, startDate, endDate }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return listBazaarRoster(client, messId, { startDate, endDate });
  });
}

// ─── Inventory / Utensils ───

export async function addInventoryItemService({ messId, actorUserId, name, quantity, category, condition, location, note }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return addInventoryItem(client, { messId, name, quantity, category, condition, location, note });
  });
}

export async function listInventoryItemsService({ messId, actorUserId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return listInventoryItems(client, messId);
  });
}

// ─── Complaints / Suggestions ───

export async function submitComplaintService({ messId, actorUserId, title, description, isAnonymous }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return createComplaint(client, {
      messId,
      memberId: actor.id,
      title,
      description,
      isAnonymous,
    });
  });
}

export async function listComplaintsService({ messId, actorUserId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return listComplaints(client, messId);
  });
}

export async function resolveComplaintService({ messId, actorUserId, complaintId, resolutionNote }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active' || actor.role !== 'manager') {
      throw new Error('Only managers can resolve complaints');
    }

    return resolveComplaint(client, {
      messId,
      complaintId,
      resolutionNote,
      resolverUserId: actorUserId,
    });
  });
}

// ─── Notices ───

export async function createNoticeService({ messId, actorUserId, title, content, isPinned }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active' || actor.role !== 'manager') {
      throw new Error('Only managers can publish notices');
    }

    return createNotice(client, {
      messId,
      title,
      content,
      isPinned,
      createdByUserId: actorUserId,
    });
  });
}

export async function listNoticesService({ messId, actorUserId }) {
  return withTransaction(async (client) => {
    const actor = await getMemberByUserId(client, messId, actorUserId);
    if (!actor || actor.status !== 'active') throw new Error('Not an active member');

    return listNotices(client, messId);
  });
}
