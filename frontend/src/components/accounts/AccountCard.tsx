import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import { AccountBalance, AttachMoney, Timeline, MoreVert } from '@mui/icons-material';
import { Account, Balance } from '../../services/api';
import { currencyFormat } from '../../utils/formatting';
import { getDashboardPalette } from '../../config/colorPalettes';
import { useTheme } from '../../contexts/ThemeContext';
import { hexToRgba, getBorderOpacity } from '../dashboard/utils';

interface AccountCardProps {
  account: Account;
  balance: number;
  nativeBalance: number;
  displayCurrency: string;
  showNativeCurrency: boolean;
  onCardClick: () => void;
  onMenuClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  balance,
  nativeBalance,
  displayCurrency,
  showNativeCurrency,
  onCardClick,
  onMenuClick,
}) => {
  const { colorPalette } = useTheme();
  const colors = getDashboardPalette(colorPalette);

  const getAccountIcon = (accountType: string) => {
    const type = accountType.toLowerCase();
    if (type.includes('cash') || type.includes('current') || type.includes('checking')) {
      return <AttachMoney />;
    } else if (type.includes('investment')) {
      return <Timeline />;
    }
    return <AccountBalance />;
  };

  return (
    <Card
      elevation={0}
      onClick={onCardClick}
      sx={{
        height: '100%',
        cursor: 'pointer',
        background: `linear-gradient(135deg, ${colors.card_bg} 0%, ${hexToRgba(colors.card_subtext, 0.02)} 100%)`,
        borderRadius: 4,
        border: `1px solid ${colors.card_subtext}${getBorderOpacity(0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          borderColor: colors.card_subtext + '30',
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '60px',
          height: '60px',
          background: `radial-gradient(circle, ${hexToRgba(colors.card_subtext, 0.05)} 0%, transparent 70%)`,
          borderRadius: '50%',
        },
      }}
    >
      <CardContent sx={{ position: 'relative', zIndex: 1 }}>
        <Stack spacing={1.5}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
              <AccountBalance
                sx={{
                  color: colors.card_subtext,
                  fontSize: 18,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  letterSpacing: '-0.01em',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                }}
              >
                {account.institution}
              </Typography>
            </Stack>
            <IconButton
              size="small"
              onClick={onMenuClick}
              sx={{
                color: colors.card_subtext,
                '&:hover': {
                  backgroundColor: hexToRgba(colors.card_subtext, 0.1),
                },
              }}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Stack>
          <Typography
            variant="body2"
            sx={{
              color: colors.card_subtext,
              fontSize: '0.9rem',
              fontWeight: 400,
              fontFamily: 'Inter, -apple-system, sans-serif',
            }}
          >
            {account.account_name}
          </Typography>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
            <Chip
              icon={getAccountIcon(account.account_type)}
              label={account.account_type}
              size="small"
              variant="outlined"
              sx={{
                color: colors.card_subtext,
                borderColor: colors.card_subtext + '30',
                textTransform: 'uppercase',
                fontSize: '0.7rem',
                fontWeight: 500,
                height: 24,
                fontFamily: 'Inter, -apple-system, sans-serif',
                '& .MuiChip-icon': {
                  color: colors.card_subtext,
                },
              }}
            />
            <Stack alignItems="flex-end" spacing={0.5}>
              <Typography
                variant="h6"
                sx={{
                  color: colors.card_text,
                  fontWeight: 700,
                  fontSize: { xs: '1rem', sm: '1.4rem' },
                  letterSpacing: '-0.02em',
                  fontFamily: 'Inter, -apple-system, sans-serif',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {currencyFormat(balance, displayCurrency)}
              </Typography>
              {!showNativeCurrency && (
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.card_subtext,
                    fontSize: '0.75rem',
                    fontFamily: 'Inter, -apple-system, sans-serif',
                  }}
                >
                  {currencyFormat(nativeBalance, account.currency_code)} native
                </Typography>
              )}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AccountCard;

