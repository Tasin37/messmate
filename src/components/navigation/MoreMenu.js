'use client';

import { useState, useEffect, useCallback } from 'react';

export default function MoreMenu({ activeMess, period, user, onRefresh }) {
  const [activeSection, setActiveSection] = useState('members'); // 'members' | 'rotation' | 'shopping' | 'notices' | 'inventory' | 'complaints' | 'settings'

  // Member Management State
  const [members, setMembers] = useState([]);
  const [memberFilter, setMemberFilter] = useState('active'); // 'active' | 'inactive'
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Member Modal form fields
  const [memberName, setMemberName] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberRoom, setMemberRoom] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  // Manager Rotation Schedule State
  const [rotationType, setRotationType] = useState('daily'); // 'daily' | 'monthly'
  const [rotationDays, setRotationDays] = useState(7); // default 7 days stepper

  // Shopping List (Extra Feature 9)
  const [shoppingList, setShoppingList] = useState([]);
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [newShoppingQty, setNewShoppingQty] = useState('');

  // Notice Board (Extra Feature 9)
  const [notices, setNotices] = useState([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');

  // Utensils / Inventory List (Extra Feature 9)
  const [inventory, setInventory] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryName, setInventoryName] = useState('');
  const [inventoryQty, setInventoryQty] = useState(1);
  const [inventoryCondition, setInventoryCondition] = useState('good');
  const [inventoryLocation, setInventoryLocation] = useState('রান্নাঘর');

  // Complaints & Suggestions (Extra Feature 9)
  const [complaints, setComplaints] = useState([]);
  const [newComplaintTitle, setNewComplaintTitle] = useState('');
  const [newComplaintDesc, setNewComplaintDesc] = useState('');
  const [newComplaintIsAnon, setNewComplaintIsAnon] = useState(false);

  // Month Lock / Close Toggle
  const [isMonthLocked, setIsMonthLocked] = useState(period?.status === 'closed');

  // Settings State
  const [language, setLanguage] = useState('bn');
  const [darkMode, setDarkMode] = useState(false);

  // 1. Fetch Members
  const fetchMembers = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/members`);
      const data = await res.json();
      if (data.data) setMembers(data.data);
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  }, [activeMess?.id]);

  // 2. Fetch Shopping List
  const fetchShoppingList = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/shopping-list`);
      const data = await res.json();
      if (data.data) setShoppingList(data.data);
    } catch (err) {
      console.error('Failed to load shopping list:', err);
    }
  }, [activeMess?.id]);

  // 3. Fetch Notices
  const fetchNotices = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/notices`);
      const data = await res.json();
      if (data.data) setNotices(data.data);
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  }, [activeMess?.id]);

  // 4. Fetch Inventory
  const fetchInventory = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/inventory`);
      const data = await res.json();
      if (data.data) setInventory(data.data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }, [activeMess?.id]);

  // 5. Fetch Complaints
  const fetchComplaints = useCallback(async () => {
    if (!activeMess?.id) return;
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/complaints`);
      const data = await res.json();
      if (data.data) setComplaints(data.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    }
  }, [activeMess?.id]);

  useEffect(() => {
    fetchMembers();
    fetchShoppingList();
    fetchNotices();
    fetchInventory();
    fetchComplaints();
    if (period) {
      setIsMonthLocked(period.status === 'closed');
    }
  }, [fetchMembers, fetchShoppingList, fetchNotices, fetchInventory, fetchComplaints, period]);

  // Handle Save / Edit Member
  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!memberName.trim()) return;

    setMemberSubmitting(true);
    try {
      if (editingMember) {
        // Edit Member
        const res = await fetch(`/api/v1/messes/${activeMess.id}/members/${editingMember.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            display_name: memberName,
            phone: memberPhone || null,
            room_label: memberRoom || null,
            role: memberRole,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to update member');
      } else {
        // Add Member
        const res = await fetch(`/api/v1/messes/${activeMess.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            displayName: memberName,
            phone: memberPhone || undefined,
            roomLabel: memberRoom || undefined,
            role: memberRole,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to add member');
      }

      alert('সদস্য তথ্য সফলভাবে সংরক্ষিত হয়েছে!');
      setShowMemberModal(false);
      await fetchMembers();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setMemberSubmitting(false);
    }
  };

  // Toggle Member Status (Active <-> Inactive)
  const handleToggleMemberStatus = async (member) => {
    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    const confirmMsg =
      newStatus === 'inactive'
        ? `${member.display_name}-কে নিষ্ক্রিয় করতে চান? পূর্বের সব হিসাব ও ইতিহাস সুরক্ষিত থাকবে।`
        : `${member.display_name}-কে পুনরায় সক্রিয় করতে চান?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          left_on: newStatus === 'inactive' ? new Date().toISOString().slice(0, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to change status');

      await fetchMembers();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Switch Manager Role (Rotation)
  const handlePromoteToManager = async (targetMember) => {
    if (!confirm(`${targetMember.display_name}-কে মেসের নতুন ম্যানেজার হিসেবে দায়িত্ব দিতে চান?`)) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/members/${targetMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'manager' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to switch manager');

      alert(`ম্যানেজার পরিবর্তন সম্পন্ন! নতুন দায়িত্বপ্রাপ্ত: ${targetMember.display_name}`);
      await fetchMembers();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Add Shopping Item
  const handleAddShoppingItem = async (e) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/shopping-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName: newShoppingItem,
          quantity: newShoppingQty || '১ টি',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to add item');

      setNewShoppingItem('');
      setNewShoppingQty('');
      await fetchShoppingList();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Toggle Shopping Item Purchased
  const toggleShoppingDone = async (item) => {
    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/shopping-list`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          isPurchased: !item.is_purchased,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to update item');

      await fetchShoppingList();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Add Notice
  const handleAddNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/notices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          isPinned: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to add notice');

      alert('নোটিশ প্রকাশ করা হয়েছে!');
      setShowNoticeModal(false);
      setNoticeTitle('');
      setNoticeContent('');
      await fetchNotices();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Add Inventory Item
  const handleAddInventory = async (e) => {
    e.preventDefault();
    if (!inventoryName.trim()) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inventoryName,
          quantity: parseInt(inventoryQty, 10) || 1,
          condition: inventoryCondition,
          location: inventoryLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to add inventory item');

      alert('সামগ্রী তালিকায় যুক্ত হয়েছে!');
      setShowInventoryModal(false);
      setInventoryName('');
      setInventoryQty(1);
      await fetchInventory();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Add Complaint
  const handleAddComplaint = async (e) => {
    e.preventDefault();
    if (!newComplaintTitle.trim()) return;

    try {
      const res = await fetch(`/api/v1/messes/${activeMess.id}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newComplaintTitle,
          description: newComplaintDesc,
          isAnonymous: newComplaintIsAnon,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to submit complaint');

      alert('অভিযোগ/পরামর্শ সফলভাবে জমা হয়েছে!');
      setNewComplaintTitle('');
      setNewComplaintDesc('');
      await fetchComplaints();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  // Toggle Month Lock / Close
  const handleToggleMonthLock = async () => {
    if (!period?.id) {
      alert('কোন চলতি পিরিয়ড পাওয়া যায়নি');
      return;
    }

    try {
      if (isMonthLocked) {
        // Reopen
        const reason = prompt('মাস পুনরায় আনলক করার কারণ লিখুন (কমপক্ষে ৩ অক্ষর):', 'হিসাব সংশোধনের জন্য');
        if (!reason) return;

        const res = await fetch(`/api/v1/messes/${activeMess.id}/periods/${period.id}/reopen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to reopen period');

        setIsMonthLocked(false);
        alert('হিসাব সফলভাবে আনলক করা হয়েছে!');
      } else {
        // Close / Lock
        if (!confirm('আপনি কি নিশ্চিত চলতি মাসের হিসাব লক/ক্লোজ করতে চান? ক্লোজ করলে আর কোন এডিট করা যাবে না।')) return;

        const res = await fetch(`/api/v1/messes/${activeMess.id}/periods/${period.id}/close`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Failed to close period');

        setIsMonthLocked(true);
        alert('হিসাব সফলভাবে লক ও ক্লোজ করা হয়েছে!');
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    }
  };

  const filteredMembers = members.filter((m) => m.status === memberFilter);
  const currentManagers = members.filter((m) => m.role === 'manager' && m.status === 'active');

  return (
    <div className="space-y-4">
      {/* Horizontal Scroll Menu Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 text-xs font-bold whitespace-nowrap">
          {[
            { id: 'members', label: 'সদস্য তালিকা (Members)' },
            { id: 'rotation', label: 'ম্যানেজার বদল (Rotation)' },
            { id: 'shopping', label: 'বাজার লিস্ট (Shopping)' },
            { id: 'notices', label: 'নোটিশ বোর্ড (Notices)' },
            { id: 'inventory', label: 'জিনিসপত্র (Utensils)' },
            { id: 'complaints', label: 'অভিযোগ বাক্স (Box)' },
            { id: 'settings', label: 'সেটিংস ও লক (Settings)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`py-2 px-3 rounded-xl transition ${
                activeSection === tab.id ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 1. Member Management ─── */}
      {activeSection === 'members' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">মেস সদস্য ব্যবস্থাপনা</h3>
                <p className="text-[10px] text-slate-400">নাম, ফোন, রুম/সিট, যোগদান ও প্রস্থানের তারিখ</p>
              </div>
              <button
                onClick={() => {
                  setEditingMember(null);
                  setMemberName('');
                  setMemberPhone('');
                  setMemberRoom('');
                  setMemberRole('member');
                  setShowMemberModal(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition shadow-xs"
              >
                + নতুন সদস্য যোগ
              </button>
            </div>

            {/* Active vs Inactive Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              <button
                onClick={() => setMemberFilter('active')}
                className={`flex-1 py-1.5 rounded-lg text-center ${
                  memberFilter === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                বর্তমান সক্রিয় সদস্য ({members.filter((m) => m.status === 'active').length} জন)
              </button>
              <button
                onClick={() => setMemberFilter('inactive')}
                className={`flex-1 py-1.5 rounded-lg text-center ${
                  memberFilter === 'inactive' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
              >
                মেস ছেড়ে যাওয়া সদস্য ({members.filter((m) => m.status === 'inactive').length} জন)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
            {filteredMembers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">কোন সদস্য পাওয়া যায়নি।</div>
            ) : (
              filteredMembers.map((m) => (
                <div key={m.id} className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        m.role === 'manager'
                          ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {(m.display_name || 'ম').charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900">{m.display_name}</p>
                        {m.role === 'manager' && (
                          <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full">
                            ম্যানেজার (সব এডিট)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {m.room_label ? `রুম: ${m.room_label} • ` : ''}ফোন: {m.phone || 'দেওয়া নেই'}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        যোগদান: {m.joined_on ? m.joined_on.slice(0, 10) : '২০২৬-১১-০১'}{' '}
                        {m.left_on ? `• ত্যাগ: ${m.left_on.slice(0, 10)}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <button
                      onClick={() => {
                        setEditingMember(m);
                        setMemberName(m.display_name);
                        setMemberPhone(m.phone || '');
                        setMemberRoom(m.room_label || '');
                        setMemberRole(m.role || 'member');
                        setShowMemberModal(true);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline block"
                    >
                      এডিট করুন ✎
                    </button>
                    {m.status === 'active' ? (
                      <button
                        onClick={() => handleToggleMemberStatus(m)}
                        className="text-[10px] font-semibold text-red-500 hover:underline block"
                      >
                        মেস ছাড়ুন
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleMemberStatus(m)}
                        className="text-[10px] font-semibold text-emerald-600 hover:underline block"
                      >
                        পুনরায় যুক্ত করুন
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 2. Manager Rotation (Requirement 1: Daily 1-7 days with +/- stepper or Monthly) ─── */}
      {activeSection === 'rotation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-bold text-slate-900">ম্যানেজার রোটেশন শিডিউল (Manager Change)</h3>
            <p className="text-[10px] text-slate-400">মেসের ম্যানেজার স্বয়ংক্রিয়ভাবে পরিবর্তনের নিয়ম</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Mode Selector */}
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">পরিবর্তনের ধরন (Change Frequency):</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRotationType('daily')}
                  className={`p-3 rounded-xl border text-center font-bold ${
                    rotationType === 'daily'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  দিন ভিত্তিক পরিবর্তন (Daily Basis)
                </button>
                <button
                  type="button"
                  onClick={() => setRotationType('monthly')}
                  className={`p-3 rounded-xl border text-center font-bold ${
                    rotationType === 'monthly'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  মাস ভিত্তিক পরিবর্তন (Monthly Basis)
                </button>
              </div>
            </div>

            {/* Daily Stepper Input Field as explicitly requested */}
            {rotationType === 'daily' && (
              <div className="bg-slate-50 p-3.5 rounded-xl border space-y-2.5">
                <label className="block text-slate-700 font-bold text-xs">
                  কত দিন পর পর ম্যানেজার পরিবর্তন হবে? (Rotation Days)
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setRotationDays(Math.max(1, rotationDays - 1))}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold text-lg flex items-center justify-center active:scale-95 shadow-2xs"
                  >
                    -
                  </button>
                  <div className="flex-1 text-center bg-white border border-slate-300 py-2 rounded-xl font-extrabold text-base text-emerald-700 shadow-2xs">
                    {rotationDays} দিন পর পর ({rotationDays} Days)
                  </div>
                  <button
                    type="button"
                    onClick={() => setRotationDays(rotationDays + 1)}
                    className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-slate-800 font-extrabold text-lg flex items-center justify-center active:scale-95 shadow-2xs"
                  >
                    +
                  </button>
                </div>
                <div className="flex gap-1.5 pt-1">
                  {[1, 2, 3, 5, 7, 10, 15].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setRotationDays(d)}
                      className={`flex-1 py-1 rounded text-[10px] font-bold border ${
                        rotationDays === d ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600'
                      }`}
                    >
                      {d} দিন
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Manager Banner */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-emerald-700 font-semibold block">বর্তমান দায়িত্বে থাকা ম্যানেজার:</span>
                <span className="text-sm font-extrabold text-emerald-950">
                  {currentManagers[0]?.display_name || 'নির্ধারিত হয়নি'}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  রুম: {currentManagers[0]?.room_label || 'প্রযোজ্য নয়'}
                </span>
              </div>
            </div>

            {/* List members to promote */}
            <div className="space-y-2 pt-2">
              <label className="block text-slate-700 font-bold text-xs">দায়িত্ব হস্তান্তর করুন (Handover To):</label>
              <div className="divide-y border rounded-xl overflow-hidden">
                {members
                  .filter((m) => m.status === 'active')
                  .map((m) => (
                    <div key={m.id} className="p-2.5 flex items-center justify-between bg-white text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{m.display_name}</span>
                        <span className="text-[10px] text-slate-400 block">{m.room_label || ''}</span>
                      </div>
                      {m.role === 'manager' ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          বর্তমান ম্যানেজার ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePromoteToManager(m)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 rounded font-semibold text-[10px] border"
                        >
                          ম্যানেজার করুন →
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Shopping List (Bazar list - Requirement 9) ─── */}
      {activeSection === 'shopping' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-bold text-slate-900">মেসের বাজার লিস্ট (Shopping List)</h3>
            <p className="text-[10px] text-slate-400">যে কোনো সদস্য প্রয়োজনীয় জিনিস যোগ করতে পারেন</p>
          </div>

          <form onSubmit={handleAddShoppingItem} className="flex gap-2">
            <input
              placeholder="পণ্যের নাম (যেমন: সরিষার তেল, চিনি)"
              value={newShoppingItem}
              onChange={(e) => setNewShoppingItem(e.target.value)}
              className="flex-1 border rounded-xl p-2 text-xs"
              required
            />
            <input
              placeholder="পরিমাণ"
              value={newShoppingQty}
              onChange={(e) => setNewShoppingQty(e.target.value)}
              className="w-20 border rounded-xl p-2 text-xs"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
            >
              যোগ
            </button>
          </form>

          <div className="divide-y divide-slate-100">
            {shoppingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                লিস্ট খালি। প্রয়োজনীয় পণ্য উপরে লিখে যোগ করুন।
              </div>
            ) : (
              shoppingList.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.is_purchased}
                      onChange={() => toggleShoppingDone(item)}
                      className="w-4 h-4 rounded text-emerald-600"
                    />
                    <span
                      className={
                        item.is_purchased ? 'line-through text-slate-400 font-medium' : 'font-bold text-slate-800'
                      }
                    >
                      {item.item_name} ({item.quantity})
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    যুক্তকারী: {item.added_by_name || 'সদস্য'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 4. Notice Board ─── */}
      {activeSection === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="border-b pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">মেস নোটিশ বোর্ড (Notice Board)</h3>
              <p className="text-[10px] text-slate-400">গুরুত্বপূর্ণ নিয়ম ও ঘোষণা</p>
            </div>
            <button
              onClick={() => setShowNoticeModal(true)}
              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700"
            >
              + নতুন নোটিশ
            </button>
          </div>

          <div className="space-y-2.5">
            {notices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">কোন নোটিশ নেই।</div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1">
                      <span>📌</span> {n.title}
                    </h4>
                    <span className="text-[10px] text-amber-700">
                      {n.created_at ? n.created_at.slice(0, 10) : 'আজ'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 5. Utensils / Inventory ─── */}
      {activeSection === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="border-b pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">মেসের জিনিসপত্র ও তৈজসপত্র (Inventory)</h3>
              <p className="text-[10px] text-slate-400">কুকার, সিলিন্ডার, কড়াই, থালা-বাসন ও সামগ্রী</p>
            </div>
            <button
              onClick={() => setShowInventoryModal(true)}
              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700"
            >
              + নতুন সামগ্রী
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {inventory.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">তালিকা খালি। নতুন সামগ্রী যোগ করুন।</div>
            ) : (
              inventory.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[10px] text-slate-400">
                      অবস্থান: {item.location || 'রান্নাঘর'} • অবস্থা:{' '}
                      {item.condition === 'good' ? 'ভালো (Good)' : item.condition}
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                    {item.quantity} টি
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 6. Complaints & Suggestions Box ─── */}
      {activeSection === 'complaints' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-sm font-bold text-slate-900">অভিযোগ ও পরামর্শ বাক্স (Complaint Box)</h3>
            <p className="text-[10px] text-slate-400">নাম প্রকাশ না করেও পরামর্শ পাঠানোর সুযোগ</p>
          </div>

          <form onSubmit={handleAddComplaint} className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border">
            <input
              placeholder="বিষয় (Title)"
              value={newComplaintTitle}
              onChange={(e) => setNewComplaintTitle(e.target.value)}
              className="w-full border rounded-lg p-2 bg-white"
              required
            />
            <textarea
              placeholder="বিস্তারিত লিখুন..."
              rows={2}
              value={newComplaintDesc}
              onChange={(e) => setNewComplaintDesc(e.target.value)}
              className="w-full border rounded-lg p-2 bg-white"
              required
            />
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={newComplaintIsAnon}
                  onChange={(e) => setNewComplaintIsAnon(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>নাম গোপন রাখুন (Anonymous)</span>
              </label>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg hover:bg-black"
              >
                পাঠান
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {complaints.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">কোন অভিযোগ বা পরামর্শ জমা পড়েনি।</div>
            ) : (
              complaints.map((c) => (
                <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{c.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                        c.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {c.status === 'resolved' ? 'সমাধানকৃত ✓' : 'চলমান'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{c.description}</p>
                  <p className="text-[10px] text-slate-400">
                    প্রেরক: {c.is_anonymous ? 'বেনামী (Anonymous)' : c.member_name || 'সদস্য'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ─── 7. Settings, Month Lock & Language ─── */}
      {activeSection === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4 text-xs">
          <div className="border-b pb-2">
            <h3 className="text-sm font-bold text-slate-900">মেস সেটিংস ও কন্ট্রোল</h3>
          </div>

          {/* Month Lock Feature (Requirement 9: Month close/lock korle ar edit kora jabe na) */}
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-red-950 text-xs block">হিসাব লক / মাস ক্লোজ (Month Lock)</span>
                <span className="text-[10px] text-red-800">
                  লক করা থাকলে কোনো সদস্য বা ম্যানেজার মিল ও খরচের তথ্য পরিবর্তন করতে পারবে না।
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleMonthLock}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs ${
                  isMonthLocked ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {isMonthLocked ? '🔒 লক করা আছে (Unlock)' : '🔓 আনলক (Lock Now)'}
              </button>
            </div>
          </div>

          {/* Language Switch */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="font-bold text-slate-700">ভাষা (Language)</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-3 py-1 rounded-lg font-bold ${
                  language === 'bn' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-lg font-bold ${
                  language === 'en' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Dark Mode Switch */}
          <div className="flex items-center justify-between py-2 border-b">
            <span className="font-bold text-slate-700">ডার্ক মোড (Dark Mode)</span>
            <button
              type="button"
              onClick={() => {
                setDarkMode(!darkMode);
                alert(!darkMode ? 'ডার্ক মোড সক্রিয়' : 'লাইট মোড সক্রিয়');
              }}
              className="px-3 py-1 bg-slate-100 rounded-lg font-bold"
            >
              {darkMode ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
      )}

      {/* Member Edit / Add Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5 max-h-[90vh] overflow-y-auto">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">
              {editingMember ? 'সদস্য তথ্য এডিট' : 'নতুন সদস্য যোগ'}
            </h4>
            <form onSubmit={handleSaveMember} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">সদস্যের নাম (Full Name)</label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="যেমন: তানভীর আহমেদ"
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">মোবাইল নম্বর (Phone)</label>
                <input
                  type="text"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">রুম ও সিট নং (Room / Seat No)</label>
                <input
                  type="text"
                  value={memberRoom}
                  onChange={(e) => setMemberRoom(e.target.value)}
                  placeholder="যেমন: ২০২ (সিট ১)"
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">রোল (Role)</label>
                <select
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm"
                >
                  <option value="member">সাধারণ সদস্য (Member - শুধু নিজেরটা দেখবে)</option>
                  <option value="manager">ম্যানেজার (Manager - সব এডিট করতে পারবে)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMemberModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={memberSubmitting}
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {memberSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Add Modal */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">নতুন নোটিশ জারি করুন</h4>
            <form onSubmit={handleAddNotice} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">শিরোনাম</label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="যেমন: মিল বন্ধের কাট-অফ সময়"
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">বিস্তারিত ঘোষণা</label>
                <textarea
                  rows={3}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="নোটিশের বিস্তারিত লিখুন..."
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Add Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl space-y-3.5">
            <h4 className="font-bold text-sm text-slate-900 border-b pb-2">নতুন তৈজসপত্র / সামগ্রী যোগ</h4>
            <form onSubmit={handleAddInventory} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-slate-600 font-medium mb-1">সামগ্রীর নাম</label>
                <input
                  type="text"
                  value={inventoryName}
                  onChange={(e) => setInventoryName(e.target.value)}
                  placeholder="যেমন: রাইস কুকার, গ্যাস সিলিন্ডার"
                  className="w-full border rounded-lg p-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">পরিমাণ (Quantity)</label>
                <input
                  type="number"
                  value={inventoryQty}
                  onChange={(e) => setInventoryQty(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">অবস্থান</label>
                <input
                  type="text"
                  value={inventoryLocation}
                  onChange={(e) => setInventoryLocation(e.target.value)}
                  placeholder="যেমন: রান্নাঘর, ডাইনিং"
                  className="w-full border rounded-lg p-2 text-sm"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 border rounded-xl"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                >
                  যোগ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
