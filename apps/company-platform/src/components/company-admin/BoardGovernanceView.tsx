import React from 'react';
import type {
  BoardMemberDto,
  GovernanceCommitteeDto,
  CommitteeMembershipDto
} from '@docsearch/api-contracts';
import {
  Card,
  Badge,
  TableContainer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@docsearch/ui-kit';

export interface BoardGovernanceViewProps {
  boardMembers: BoardMemberDto[];
  committees: GovernanceCommitteeDto[];
  memberships: CommitteeMembershipDto[];
}

export const BoardGovernanceView: React.FC<BoardGovernanceViewProps> = ({
  boardMembers,
  committees,
  memberships
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Board Members Table */}
      <Card
        title="Board of Directors & Governance Structure"
        subtitle="Elected board seats, director types, voting rights, and appointment terms"
        padding="none"
      >
        <TableContainer style={{ border: 'none', borderRadius: '0' }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Code</TableHead>
                <TableHead>Director Full Name</TableHead>
                <TableHead>Board Role</TableHead>
                <TableHead>Representing Entity / Stakeholder</TableHead>
                <TableHead>Voting Status</TableHead>
                <TableHead>Term Start Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boardMembers.map((bm) => (
                <TableRow key={bm.id}>
                  <TableCell style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: '700', fontSize: '0.75rem' }}>
                    {bm.memberCode}
                  </TableCell>
                  <TableCell>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>{bm.fullName}</strong>
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral">{bm.roleType}</Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.8125rem' }}>
                    {bm.representingEntity}
                  </TableCell>
                  <TableCell>
                    <Badge variant={bm.votingStatus === 'VOTING' ? 'primary' : 'neutral'}>
                      {bm.votingStatus}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontSize: '0.75rem', color: 'var(--ds-color-text-muted)' }}>
                    {new Date(bm.termStartDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={bm.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {bm.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Governance Committees & Memberships */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        <Card title="Standing Governance Committees" subtitle="Active board & executive committees" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Committee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Chair</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {committees.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {c.committeeName}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', fontFamily: 'var(--ds-font-mono)', color: 'var(--ds-color-text-muted)' }}>
                        {c.committeeCode}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{c.committeeType}</Badge>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {c.chairEmail}
                    </TableCell>
                    <TableCell style={{ fontSize: '0.8125rem', fontWeight: '600' }}>
                      {c.memberCount} seats
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        <Card title="Committee Member Assignments" subtitle="Individual director and executive assignments" padding="none">
          <TableContainer style={{ border: 'none', borderRadius: '0' }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Committee</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <strong style={{ fontSize: '0.8125rem', color: 'var(--ds-color-text-primary)' }}>
                        {m.memberName}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--ds-color-text-muted)' }}>
                        {m.memberEmail}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: '0.75rem' }}>
                      {m.committeeName ?? 'Committee'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.roleInCommittee === 'CHAIR' ? 'primary' : 'neutral'}>
                        {m.roleInCommittee}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {m.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </div>
    </div>
  );
};
